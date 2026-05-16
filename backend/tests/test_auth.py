from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_login_logout_and_me():
    login = client.post('/api/auth/login', json={'username': 'teamlead', 'password': 'lead-demo'})
    assert login.status_code == 200
    assert login.json()['user']['role'] == 'lead'

    me = client.get('/api/auth/me')
    assert me.status_code == 200
    assert me.json()['user']['username'] == 'teamlead'

    logout = client.post('/api/auth/logout')
    assert logout.status_code == 200


def test_ticket_queue_requires_auth():
    unauth = TestClient(app)
    response = unauth.get('/api/tickets')
    assert response.status_code == 401
