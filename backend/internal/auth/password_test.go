package auth

import "testing"

func TestPasswordHash(t *testing.T) {
	hash, err := HashPassword("correct-horse-battery")
	if err != nil {
		t.Fatal(err)
	}
	if !CheckPassword(hash, "correct-horse-battery") {
		t.Fatal("expected password to match")
	}
	if CheckPassword(hash, "wrong-password") {
		t.Fatal("unexpected password match")
	}
}
