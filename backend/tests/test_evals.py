from fastapi.testclient import TestClient
from backend.main import app
from backend.db import SessionLocal
from backend.models.tables import EvaluationRun, Ticket


def test_evaluations_run_and_export():
    client = TestClient(app)
    
    # 1. Login to get authentication cookies
    login = client.post('/api/auth/login', json={'username': 'teamlead', 'password': 'lead-demo'})
    assert login.status_code == 200
    
    # Make sure we have at least one ticket for evaluation to run
    db = SessionLocal()
    ticket = db.query(Ticket).first()
    if not ticket:
        ticket = Ticket(subject="Adversarial evaluation test ticket", body="This is an evaluation test.")
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
    
    # 2. Trigger evaluations run
    run_response = client.post(
        '/api/evaluations/run',
        json={'dataset': 'FAQ', 'model_version': 'gpt-4o', 'prompt_version': 'v1'}
    )
    print("RESPONSE BODY:", run_response.text)
    assert run_response.status_code == 200

    data = run_response.json()
    assert "runId" in data
    assert "groundedness" in data
    assert "hallucinationRate" in data
    assert "judgeScore" in data
    assert "retrievalPrecision" in data
    assert "latencyMs" in data
    
    # 3. Verify database persistence
    db.refresh(ticket)
    run_id = data["runId"]
    db_run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
    assert db_run is not None
    assert db_run.dataset == "FAQ"
    assert db_run.model_version == "gpt-4o"
    
    # 4. Trigger CSV export
    export_response = client.get('/api/evaluations/export')
    assert export_response.status_code == 200
    assert export_response.headers["content-type"].startswith("text/csv")
    csv_content = export_response.text
    assert "Run ID" in csv_content
    assert "Dataset" in csv_content
    assert "Groundedness" in csv_content
    assert f"EV-{run_id}" or str(run_id) in csv_content
    
    db.close()
