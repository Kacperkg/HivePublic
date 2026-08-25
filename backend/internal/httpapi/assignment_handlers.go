package httpapi

import (
	"net/http"
	"time"

	"github.com/kacperkg/the-hive/backend/internal/domain"
)

const dateLayout = "2006-01-02"

type assignmentRequest struct {
	WorkoutID string `json:"workoutId"`
}

type setRequest struct {
	Status         string   `json:"status"`
	ActualReps     *int     `json:"actualReps"`
	ActualWeightKg *float64 `json:"actualWeightKg"`
}

func (a *API) listAssignments(w http.ResponseWriter, r *http.Request) {
	from, ok := queryDate(w, r, "from")
	if !ok {
		return
	}
	to, ok := queryDate(w, r, "to")
	if !ok {
		return
	}
	if to.Before(from) || to.Sub(from) > 370*24*time.Hour {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "The date range is invalid or too large.", domain.FieldErrors{"to": "must be on or after from and within 370 days"})
		return
	}
	assignments, err := a.store.ListAssignments(r.Context(), currentUser(r.Context()).ID, from, to)
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	writeData(w, http.StatusOK, assignments)
}

func (a *API) getAssignment(w http.ResponseWriter, r *http.Request) {
	date, ok := pathDate(w, r)
	if !ok {
		return
	}
	assignment, err := a.store.GetAssignment(r.Context(), currentUser(r.Context()).ID, date)
	if err != nil {
		a.storeError(w, r, err, "Assignment")
		return
	}
	writeData(w, http.StatusOK, assignment)
}

func (a *API) assignWorkout(w http.ResponseWriter, r *http.Request) {
	date, ok := pathDate(w, r)
	if !ok {
		return
	}
	today := time.Now().UTC().Truncate(24 * time.Hour)
	if date.Before(today) {
		writeError(w, http.StatusUnprocessableEntity, "past_date", "A workout cannot be assigned to a past date.", nil)
		return
	}
	var input assignmentRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.WorkoutID == "" {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Choose a workout.", domain.FieldErrors{"workoutId": "is required"})
		return
	}
	assignment, err := a.store.AssignWorkout(r.Context(), currentUser(r.Context()).ID, input.WorkoutID, date)
	if err != nil {
		a.storeError(w, r, err, "Workout")
		return
	}
	writeData(w, http.StatusOK, assignment)
}

func (a *API) deleteAssignment(w http.ResponseWriter, r *http.Request) {
	date, ok := pathDate(w, r)
	if !ok {
		return
	}
	if err := a.store.DeleteAssignment(r.Context(), currentUser(r.Context()).ID, date); err != nil {
		a.storeError(w, r, err, "Assignment")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *API) updateSet(w http.ResponseWriter, r *http.Request) {
	date, ok := pathDate(w, r)
	if !ok {
		return
	}
	var input setRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	fields := domain.FieldErrors{}
	if input.Status != "completed" && input.Status != "skipped" {
		fields["status"] = "must be completed or skipped"
	}
	if input.Status == "completed" {
		if input.ActualReps == nil || *input.ActualReps < 0 || *input.ActualReps > 100 {
			fields["actualReps"] = "must be between 0 and 100"
		}
		if input.ActualWeightKg == nil || *input.ActualWeightKg < 0 || *input.ActualWeightKg > 99999.99 {
			fields["actualWeightKg"] = "must be between 0 and 99999.99"
		}
	}
	if len(fields) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Check the set result.", fields)
		return
	}
	set, err := a.store.UpdateAssignmentSet(r.Context(), currentUser(r.Context()).ID, date,
		r.PathValue("setID"), input.Status, input.ActualReps, input.ActualWeightKg)
	if err != nil {
		a.storeError(w, r, err, "Set")
		return
	}
	writeData(w, http.StatusOK, set)
}

func (a *API) finalizeAssignment(w http.ResponseWriter, r *http.Request) {
	date, ok := pathDate(w, r)
	if !ok {
		return
	}
	assignment, err := a.store.FinalizeAssignment(r.Context(), currentUser(r.Context()).ID, date)
	if err != nil {
		a.storeError(w, r, err, "Assignment")
		return
	}
	writeData(w, http.StatusOK, assignment)
}

func (a *API) dashboard(w http.ResponseWriter, r *http.Request) {
	date, ok := pathDate(w, r)
	if !ok {
		return
	}
	dashboard, err := a.store.Dashboard(r.Context(), currentUser(r.Context()).ID, date)
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	writeData(w, http.StatusOK, dashboard)
}

func pathDate(w http.ResponseWriter, r *http.Request) (time.Time, bool) {
	date, err := time.Parse(dateLayout, r.PathValue("date"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_date", "The date must use YYYY-MM-DD.", nil)
		return time.Time{}, false
	}
	return date, true
}

func queryDate(w http.ResponseWriter, r *http.Request, name string) (time.Time, bool) {
	date, err := time.Parse(dateLayout, r.URL.Query().Get(name))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_date", name+" must use YYYY-MM-DD.", nil)
		return time.Time{}, false
	}
	return date, true
}
