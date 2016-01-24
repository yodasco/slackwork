const SLACK_URL = 'https://hooks.slack.com/services/T025JGKDJ/B0JP415NY/';


const SLACK_CHANNEL_NAME = "#ops";
const SLACK_USERNAME = "webhookbot";
const kmsEncyptedToken = 'CiAXsvtKhlUvUHE9TMzxpFUBgr+PEvz3MHzCIeDaGgip+hKfAQEBAgB4F7L7SoZVL1BxPUzM8aRVAYK/jxL89zB8wiHg2hoIqfoAAAB2MHQGCSqGSIb3DQEHBqBnMGUCAQAwYAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAwmvNfzcM19c5CnntgCARCAM0qOjU9nwa2JHwP2TZi7Tbb4GOVHhybA6sPgfblR6284w9jZ8sLZYrrNW8YRYMSuPbuSAQ==';

console.log('Loading function');

const AWS = require('aws-sdk');
const url = require('url');
const https = require('https');
const qs = require('querystring');

exports.handle = function(event, context) {
  console.log('event=%j', event);
  var slackReqOpts = null;
  if (slackReqOpts) {
    // Container reuse, simply process the event with the key in memory
    processEvent(event, context, slackReqOpts);
  } else {
    const encryptedBuf = new Buffer(kmsEncyptedToken, 'base64');
    const cipherText = {CiphertextBlob: encryptedBuf};

    const kms = new AWS.KMS();
    kms.decrypt(cipherText, function (err, data) {
      if (err) {
        console.log("Decrypt error: " + err);
        context.fail(err);
      } else {
        token = data.Plaintext.toString('ascii');
        const slackUrl = SLACK_URL;
        slackReqOpts = url.parse(slackUrl + token);
        slackReqOpts.method = 'POST';
        slackReqOpts.headers = {'Content-Type': 'application/json'};
        processEvent(event, context, slackReqOpts);
      }
    });
  }
};


var processEvent = function(event, context, slackReqOpts) {
  var source = event.source;
  var region = event.region;
  var text = [];
  text.push(source);
  text.push(' (' + region + ')');
  text.push(': ');

  var detail = event.detail;
  if (source === 'aws.ec2') {
    var instanceId = detail['instance-id'];
    var ec2 = new AWS.EC2();
    ec2.describeInstances({InstanceIds: [instanceId]}, function(error, data) {
      if (error) {
        console.error(error); // an error occurred
        context.fail(error);
      } else {
        var instance = data.Reservations[0].Instances[0];
        var type = instance.InstanceType
        var name = getName(instance.Tags);
        console.log('type=%s   name=%s', type, name);
        var state = detail.state;
        text.push(instanceId);
        text.push(' (')
        if (name) {
          text.push(name);
          text.push(', ');
        }
        text.push(type);
        text.push(') ')
        text.push(' is ');
        text.push(state);
        var color = getColorByState(state);
        text = text.join('');
        var url = getEc2Url(instanceId, region);
        var extraText = 'See <' + url + '|' + instanceId + '>';
        postText(text, extraText, color, slackReqOpts, context);
      }
    });
  } else {
    text = text.join('');
    postText(text, '', 'good', slackReqOpts, context);
  }
};

var getEc2Url = function(instanceId, region) {
  return 'https://' + region + '.console.aws.amazon.com/ec2/v2/home?region=' + region + '#Instances:search=' + instanceId;
};

var postText = function(text, extraText, color, slackReqOpts, context) {
  var req = https.request(slackReqOpts, function (res) {
    if (res.statusCode === 200) {
      context.succeed('posted to slack');
    } else {
      context.fail('status code: ' + res.statusCode);
    }
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    context.fail(e.message);
  });
  req.write(JSON.stringify({
    channel: SLACK_CHANNEL_NAME,
    username: SLACK_USERNAME,
    icon_emoji: ":ghost:",
    attachments: [
      {
        fallback: text,
        pretext: "AWS update",
        color: color,
        fields: [
          {
            title: text,
            value: extraText,
            short: false // Optional flag indicating whether the `value` is short enough to be displayed side-by-side with other values
          }
        ]
      }
    ]
  }));
  req.end();
};

var getName = function(tags) {
  var names = tags.filter(function(t) {
    return t.Key === 'Name';
  });
  if (names && names.length) {
    return names[0].Value;
  }
}

var getColorByState = function(state) {

  const colors = {
    "stopping": "#701943",
    "stopped": "#701943",
    "shutting-down": "#EF591C",
    "running": "#1F9F88",
    "pending": "#C4D225",
    "terminated": "#701943"
  }

  var color = colors[state] || "#322B0E";
  return color;
}