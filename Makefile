deploy:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex  deploy

test-status-reminder:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex invoke status-reminder < functions/status-reminder/request.json

test-aws-events-to-slack:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex invoke aws-events-to-slack < functions/aws-events-to-slack/request.json

logs-status-reminder:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex logs status-reminder

logs-aws-events-to-slack:
	AWS_REGION=us-west-2 $(GOPATH)/bin/apex logs aws-events-to-slack
