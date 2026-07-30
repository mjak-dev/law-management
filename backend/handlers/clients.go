package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"test2-project/backend/models"
)

func HandleClients(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getClients(w, r)
	case http.MethodPost:
		createClient(w, r)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func HandleClientByID(w http.ResponseWriter, r *http.Request) {
	// Simple path parameter routing: /api/clients/{id}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		WriteError(w, http.StatusBadRequest, "Invalid request path")
		return
	}
	idStr := parts[3]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid client ID")
		return
	}

	switch r.Method {
	case http.MethodDelete:
		deleteClient(w, r, id)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getClients(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query("SELECT id, name, email, phone, company, created_at FROM clients ORDER BY name ASC")
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var c models.Client
		if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Company, &c.CreatedAt); err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		clients = append(clients, c)
	}

	if clients == nil {
		clients = []models.Client{}
	}

	WriteJSON(w, http.StatusOK, clients)
}

func createClient(w http.ResponseWriter, r *http.Request) {
	var c models.Client
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if c.Name == "" || c.Email == "" {
		WriteError(w, http.StatusBadRequest, "Name and Email are required fields")
		return
	}

	res, err := DB.Exec("INSERT INTO clients (name, email, phone, company) VALUES (?, ?, ?, ?)",
		c.Name, c.Email, c.Phone, c.Company)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	c.ID = id

	WriteJSON(w, http.StatusCreated, c)
}

func deleteClient(w http.ResponseWriter, r *http.Request, id int64) {
	res, err := DB.Exec("DELETE FROM clients WHERE id = ?", id)
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
		WriteError(w, http.StatusNotFound, "Client not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Client deleted successfully"})
}
