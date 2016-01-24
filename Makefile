deploy:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex  deploy

test:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex invoke status-reminder < functions/status-reminder/request.json

logs:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex logs status-reminder
