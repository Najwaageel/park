# Backend routes 

### -User
| HTTP Method | URL | Request Body | Success status | Error Status | Description |
|-------------|-----|--------------|----------------|--------------|-------------|
| POST | /signup | {firstName, lastName, email, password, avatar} | 201 | 400 |  |
| POST | /login | { email, password } | 200 | 400 | |
| POST | /login/admin | { email, password } | 200 | 403 | |
| GET | /profile | | | | |
| POST | /add-admin | { firstName, lastName, email, password, avatar } | 200 | 500 | |
| GET | /users |  | | | |
| DELETE | /users/:id | | 200 | 500 | |
| GET | /gametickets | | 200 | 500 | |


### -Game
| HTTP Method | URL | Request Body | Success status | Error Status | Description |
|-------------|-----|--------------|----------------|--------------|-------------|
