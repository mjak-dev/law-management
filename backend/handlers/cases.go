package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"test2-project/backend/models"
	"time"
)

func HandleCases(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getCases(w, r)
	case http.MethodPost:
		createCase(w, r)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func HandleCaseByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		WriteError(w, http.StatusBadRequest, "Invalid request path")
		return
	}
	idStr := parts[3]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid case ID")
		return
	}

	switch r.Method {
	case http.MethodPut:
		updateCase(w, r, id)
	case http.MethodDelete:
		deleteCase(w, r, id)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getCases(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT c.id, c.title, c.client_id, cl.name as client_name, c.case_number, 
		       c.practice_area, c.status, c.description, c.court, c.date_opened, c.created_at
		FROM cases c
		JOIN clients cl ON c.client_id = cl.id
		ORDER BY c.created_at DESC`

	rows, err := DB.Query(query)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var cases []models.Case
	for rows.Next() {
		var cs models.Case
		if err := rows.Scan(&cs.ID, &cs.Title, &cs.ClientID, &cs.ClientName, &cs.CaseNumber,
			&cs.PracticeArea, &cs.Status, &cs.Description, &cs.Court, &cs.DateOpened, &cs.CreatedAt); err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		cases = append(cases, cs)
	}

	if cases == nil {
		cases = []models.Case{}
	}

	WriteJSON(w, http.StatusOK, cases)
}

func createCase(w http.ResponseWriter, r *http.Request) {
	var cs models.Case
	if err := json.NewDecoder(r.Body).Decode(&cs); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if cs.Title == "" || cs.ClientID == 0 || cs.CaseNumber == "" || cs.PracticeArea == "" {
		WriteError(w, http.StatusBadRequest, "Title, ClientID, CaseNumber, and PracticeArea are required")
		return
	}

	if cs.Status == "" {
		cs.Status = "Open"
	}
	if cs.DateOpened.IsZero() {
		cs.DateOpened = time.Now()
	}

	res, err := DB.Exec(`
		INSERT INTO cases (title, client_id, case_number, practice_area, status, description, court, date_opened)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		cs.Title, cs.ClientID, cs.CaseNumber, cs.PracticeArea, cs.Status, cs.Description, cs.Court, cs.DateOpened)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	cs.ID = id

	// Fetch client name for response
	DB.QueryRow("SELECT name FROM clients WHERE id = ?", cs.ClientID).Scan(&cs.ClientName)

	WriteJSON(w, http.StatusCreated, cs)
}

func updateCase(w http.ResponseWriter, r *http.Request, id int64) {
	var cs models.Case
	if err := json.NewDecoder(r.Body).Decode(&cs); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if cs.Status == "" || cs.Title == "" {
		WriteError(w, http.StatusBadRequest, "Title and Status are required")
		return
	}

	_, err := DB.Exec(`
		UPDATE cases 
		SET title = ?, status = ?, description = ?, court = ? 
		WHERE id = ?`,
		cs.Title, cs.Status, cs.Description, cs.Court, id)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Case updated successfully"})
}

func deleteCase(w http.ResponseWriter, r *http.Request, id int64) {
	res, err := DB.Exec("DELETE FROM cases WHERE id = ?", id)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if rowsAffected == 0 {
		WriteError(w, http.StatusNotFound, "Case not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Case deleted successfully"})
}
