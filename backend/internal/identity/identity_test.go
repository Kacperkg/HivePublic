package identity

import (
	"bytes"
	"testing"
)

func TestSessionTokenDigest(t *testing.T) {
	t.Parallel()
	raw, digest, err := SessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if raw == "" || len(digest) != 32 {
		t.Fatalf("unexpected token output: %q %d", raw, len(digest))
	}
	if !bytes.Equal(digest, TokenDigest(raw)) {
		t.Fatal("digest does not match token")
	}
}

func TestUUIDShapeAndUniqueness(t *testing.T) {
	t.Parallel()
	first, err := UUID()
	if err != nil {
		t.Fatal(err)
	}
	second, err := UUID()
	if err != nil {
		t.Fatal(err)
	}
	if len(first) != 36 || first == second || first[14] != '4' {
		t.Fatalf("invalid UUIDs: %q %q", first, second)
	}
}
