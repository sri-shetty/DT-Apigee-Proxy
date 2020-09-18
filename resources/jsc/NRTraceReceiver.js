//Generate 16 chars Hex Digits
function randHex(len) {
  var maxlen = 8,
      min = Math.pow(16,Math.min(len,maxlen)-1), 
      max = Math.pow(16,Math.min(len,maxlen)) - 1,
      n   = Math.floor( Math.random() * (max-min+1) ) + min,
      r   = n.toString(16);
  while ( r.length < len ) {
     r = r + randHex( len - maxlen );
  }
  return r;
}

//Read W3C trace context
var w3_traceparent = context.getVariable("request.header.traceparent");
var w3_tracestate = context.getVariable("request.header.tracestate");
//print("Length Trace Parent:"+w3_traceparent.length);
//print("Length Trace State:"+w3_tracestate.length);

//Decode traceparent
//print("w3 trace parent:"+w3_traceparent);
if (w3_traceparent !== null)
{
    try {
        const regex = /\w+(?:\s*\w+)*/gm;
        var m;
        var w3vernum="";
        var w3traceid="";
        var w3parentid="";
        var w3traceflag="";
        var tracesampled=false;
        var targetTS=0;

        while ((tp = regex.exec(w3_traceparent)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (tp.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        
            tp.forEach((match) => {
                if (tp.index===0) {
                    w3vernum=match;
                    //print("Version Num:" +w3vernum);
                }
                else if (tp.index===3) {
                    w3traceid=match;
                    //print("Trace Id:" +w3traceid);
                }
                else if (tp.index>52) {
                    w3traceflag=match;
                    //print("Trace Flag:" +w3traceflag);
                }
                else {
                    w3parentid=match;
                    //print("Parent Id:" +w3parentid);
                }
            });
        }
        
        //Decode tracestate
        //print("w3 trace state:"+w3_tracestate);
        while ((ts = regex.exec(w3_tracestate)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (ts.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        
            ts.forEach((match) => {
                if (ts.index>(w3_tracestate.length-14)) {
                    targetTS=match;
                    print("Target Timestamp :" +targetTS);
                }
            });
        }
        context.setVariable("dt.headersFound", true);
        
    } catch(e) {
        print("Something went wrong in decoding Trace Parent or State.");
    }

    //Set trace sampled
    if(w3traceflag==="01") {
        tracesampled=true;
    }
    //print("Trace Sampled:"+tracesampled);

    //Generate parentID/spanID for apigee and target
    var apigeeSpanID=randHex(16); 
    var targetSpanID=randHex(16);

    //Set the context variables
    context.setVariable("dt.traceID",w3traceid);            // the trace id, same for all spans
    context.setVariable("dt.incomingParentID",w3parentid);   // the incoming span id that is our parent
    context.setVariable("dt.apigeeSpanID",apigeeSpanID);    // a span id to cover the whole apigee flow
    context.setVariable("dt.targetSpanID",targetSpanID);    // a span id to just cover the target request
    context.setVariable("dt.sampled",tracesampled);            //indicates if incoming span is sampled
    context.setVariable("dt.apigeeStartTime",context.getVariable("client.received.start.timestamp"));

    //Rewrite the w3 trace parent header so that it has target as a parent span -- but only if sampled to avoid orphaning
    if(tracesampled) {
        //print("pre w3 parent"+w3_traceparent);
        var np = w3_traceparent.indexOf(w3parentid);
        var str1 = w3_traceparent.substr(0, np);
        var str2 = w3_traceparent.substr(np+16, w3_traceparent.length);
        w3_traceparent = str1+targetSpanID+str2;
        context.setVariable("request.header.traceparent",w3_traceparent);
        //print("post w3 parent"+w3_traceparent);
    
        //print("pre w3 state"+w3_tracestate);
        context.setVariable("dt.targetTS",targetTS); 
        var ns = w3_tracestate.indexOf(w3parentid);
        var strs1 = w3_tracestate.substr(0, ns);
        var strs2 = w3_tracestate.substr(ns+16, w3_tracestate.length);
        w3_tracestate = strs1+targetSpanID+strs2;
        context.setVariable("dt.w3TraceState",w3_tracestate); 
        context.setVariable("request.header.tracestate", w3_tracestate);
        //print("post w3 state"+w3_tracestate);
    }
}
else 
{
    print('W3C trace headers not included on inbound request');
}