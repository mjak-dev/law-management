package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"test2-project/backend/models"
	"time"
)

func HandleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getTasks(w, r)
	case http.MethodPost:
		createTask(w, r)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func HandleTaskByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		WriteError(w, http.StatusBadRequest, "Invalid request path")
		return
	}
	idStr := parts[3]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}

	switch r.Method {
	case http.MethodPut:
		updateTask(w, r, id)
	case http.MethodDelete:
		deleteTask(w, r, id)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getTasks(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT t.id, t.title, t.case_id, c.title as case_title, t.due_date, t.status, t.priority, t.created_at
		FROM tasks t
		JOIN cases c ON t.case_id = c.id
		ORDER BY t.status DESC, t.due_date ASC`

	rows, err := DB.Query(query)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.CaseID, &t.CaseTitle, &t.DueDate, &t.Status, &t.Priority, &t.CreatedAt); err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		tasks = append(tasks, t)
	}

	if tasks == nil {
		tasks = []models.Task{}
	}

	WriteJSON(w, http.StatusOK, tasks)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	var t models.Task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if t.Title == "" || t.CaseID == 0 {
		WriteError(w, http.StatusBadRequest, "Title and CaseID are required")
		return
	}

	if t.Status == "" {
		t.Status = "Pending"
	}
	if t.Priority == "" {
		t.Priority = "Medium"
	}
	if t.DueDate.IsZero() {
		t.DueDate = time.Now().AddDate(0, 0, 7) // default 7 days due
	}

	res, err := DB.Exec("INSERT INTO tasks (title, case_id, due_date, status, priority) VALUES (?, ?, ?, ?, ?)",
		t.Title, t.CaseID, t.DueDate, t.Status, t.Priority)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	t.ID = id

	// Fetch case title
	DB.QueryRow("SELECT title FROM cases WHERE id = ?", t.CaseID).Scan(&t.CaseTitle)

	WriteJSON(w, http.StatusCreated, t)
}

func updateTask(w http.ResponseWriter, r *http.Request, id int64) {
	var t models.Task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if t.Status == "" {
		WriteError(w, http.StatusBadRequest, "Status is required")
		return
	}

	_, err := DB.Exec("UPDATE tasks SET status = ? WHERE id = ?", t.Status, id)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Task updated successfully"})
}

func deleteTask(w http.ResponseWriter, r *http.Request, id int64) {
	res, err := DB.Exec("DELETE FROM tasks WHERE id = ?", id)
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
		WriteError(w, http.StatusNotFound, "Task not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Task deleted successfully"})
}
