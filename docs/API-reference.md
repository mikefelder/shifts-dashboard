# API Reference

## Base URL
```
http://localhost:3000/api
```

## Accounts

### List All Accounts
```http
GET /accounts/list
```

Query Parameters:
- `batch` (optional): Number of records per page (default: 120)
- `start` (optional): Starting page number (default: 1)

Response:
```json
{
    "result": {
        "accounts": [...],
        "page": {
            "batch": 120,
            "start": 1,
            "next": null
        }
    }
}
```

### Get Self Account
```http
GET /accounts/self
```

Query Parameters:
- `extended` (optional): Include extended information (default: true)
- `user_actions` (optional): Include user actions (default: true)

Response:
```json
{
    "result": {
        "id": "123",
        "username": "example",
        "email": "user@example.com"
        // Additional fields when extended=true
    }
}
```

### List Accounts by Workgroup
```http
GET /accounts/workgroup/:workgroupId
```

Parameters:
- `workgroupId`: ID of the workgroup

Response:
```json
{
    "result": {
        "accounts": [...]
    }
}
```

## Workgroups

### List All Workgroups
```http
GET /workgroups/list
```

Query Parameters:
- `extended` (optional): Include extended information (default: true)

Response:
```json
{
    "result": {
        "workgroups": [...]
    }
}
```

### List Workgroup Roles
```http
GET /workgroups/:workgroupId/roles
```

Parameters:
- `workgroupId`: ID of the workgroup

Response:
```json
{
    "result": {
        "roles": [...]
    }
}
```

## Roles

### Get Role
```http
GET /roles/:roleId
```

Parameters:
- `roleId`: ID of the role

Response:
```json
{
    "result": {
        "id": "123",
        "name": "Example Role"
    }
}
```

### List Roles
```http
GET /roles/list
```

Response:
```json
{
    "result": {
        "roles": [...]
    }
}
```

## Shifts

### List Shifts
```http
GET /shifts/list
```

Query Parameters:
- `workgroup`: Workgroup ID (required)

Response:
```json
{
    "result": {
        "shifts": [...]
    }
}
```

### Who's On
```http
GET /shifts/whos-on
```

Query Parameters:
- `workgroup`: Workgroup ID (required)

Response:
```json
{
    "result": {
        "shifts": [...],
        "accounts": [...]
    }
}
```

## Calendar

### Get Calendar Summary
```http
GET /calendar/summary
```

Response:
```json
{
    "result": {
        "summary": {...}
    }
}
```

## System

### Echo Test
```http
GET /system/echo
```

Request Body:
```json
{
    "message": "test"
}
```

Response:
```json
{
    "result": {
        "message": "test"
    }
}
```

## Error Responses

All endpoints can return the following error response:

```json
{
    "error": "Error message description"
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
