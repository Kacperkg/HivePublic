package httpapi

import (
	"net/http"

	"github.com/kacperkg/the-hive/backend/internal/domain"
)

type workoutRequest struct {
	Name      string                 `json:"name"`
	Exercises []domain.ExerciseInput `json:"exercises"`
}

func (a *API) listWorkouts(w http.ResponseWriter, r *http.Request) {
	workouts, err := a.store.ListWorkouts(r.Context(), currentUser(r.Context()).ID)
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	writeData(w, http.StatusOK, workouts)
}

func (a *API) getWorkout(w http.ResponseWriter, r *http.Request) {
	workout, err := a.store.GetWorkout(r.Context(), currentUser(r.Context()).ID, r.PathValue("workoutID"))
	if err != nil {
		a.storeError(w, r, err, "Workout")
		return
	}
	writeData(w, http.StatusOK, workout)
}

func (a *API) createWorkout(w http.ResponseWriter, r *http.Request) {
	var input workoutRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	if fields := domain.ValidateWorkout(input.Name, input.Exercises); len(fields) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Check the highlighted fields.", fields)
		return
	}
	workout, err := a.store.CreateWorkout(r.Context(), currentUser(r.Context()).ID, input.Name, input.Exercises)
	if err != nil {
		a.storeError(w, r, err, "Workout")
		return
	}
	writeData(w, http.StatusCreated, workout)
}

func (a *API) updateWorkout(w http.ResponseWriter, r *http.Request) {
	var input workoutRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	if fields := domain.ValidateWorkout(input.Name, input.Exercises); len(fields) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Check the highlighted fields.", fields)
		return
	}
	workout, err := a.store.UpdateWorkout(r.Context(), currentUser(r.Context()).ID, r.PathValue("workoutID"), input.Name, input.Exercises)
	if err != nil {
		a.storeError(w, r, err, "Workout")
		return
	}
	writeData(w, http.StatusOK, workout)
}

func (a *API) deleteWorkout(w http.ResponseWriter, r *http.Request) {
	if err := a.store.DeleteWorkout(r.Context(), currentUser(r.Context()).ID, r.PathValue("workoutID")); err != nil {
		a.storeError(w, r, err, "Workout")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
