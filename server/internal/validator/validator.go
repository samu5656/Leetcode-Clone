package validator

// Validator holds validation errors keyed by field name.
type Validator struct {
	Errors map[string]string
}

// New returns a new Validator instance.
func New() *Validator {
	return &Validator{Errors: make(map[string]string)}
}

// Valid returns true if no errors have been recorded.
func (v *Validator) Valid() bool {
	return len(v.Errors) == 0
}

// AddError adds an error message for a given field (only the first error per field is kept).
func (v *Validator) AddError(key, message string) {
	if _, exists := v.Errors[key]; !exists {
		v.Errors[key] = message
	}
}

// Check adds an error if the condition is false.
func (v *Validator) Check(ok bool, key, message string) {
	if !ok {
		v.AddError(key, message)
	}
}

// In returns true if a value is in the list.
func In(value string, list ...string) bool {
	for _, item := range list {
		if value == item {
			return true
		}
	}
	return false
}
