package data

// Filters holds pagination parameters.
type Filters struct {
	Page     int
	PageSize int
}

// Limit returns the SQL LIMIT value.
func (f Filters) Limit() int {
	return f.PageSize
}

// Offset returns the SQL OFFSET value.
func (f Filters) Offset() int {
	return (f.Page - 1) * f.PageSize
}

// Metadata holds pagination metadata for responses.
type Metadata struct {
	CurrentPage  int `json:"current_page"`
	PageSize     int `json:"page_size"`
	TotalRecords int `json:"total_records"`
	TotalPages   int `json:"total_pages"`
}

// CalculateMetadata creates pagination metadata with total pages computed.
func CalculateMetadata(page, pageSize, totalRecords int) Metadata {
	totalPages := 0
	if totalRecords > 0 {
		totalPages = (totalRecords + pageSize - 1) / pageSize
	}
	return Metadata{
		CurrentPage:  page,
		PageSize:     pageSize,
		TotalRecords: totalRecords,
		TotalPages:   totalPages,
	}
}
