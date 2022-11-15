import YoutubeTranscript from 'youtube-transcript';

const TRANSCRIPT_MAX_CHARS = 500;

class Result {
    constructor(ok, value, error) {
        this.ok = ok;
        this.value = value;
        if (!ok && value != null) {
            console.log('Result: value should be null when ok is false');
        }
        this.error = error;
        if (ok && error != null) {
            console.log('Result: error should be null when ok is true');
        }
    }

    static ok(value) {
        return new Result(true, value, null);
    }

    static error(error) {
        return new Result(false, null, error);
    }

    isOk() {
        return this.ok;
    }

    isError() {
        return !this.ok;
    }

    unwrap() {
        if (this.isError()) {
            throw this.error;
        }
        return this.value;
    }

    match(ok, error) {
        if (this.isOk()) {
            return ok(this.value);
        }
        return error(this.error);
    }

    flat_map(f) {
        if (this.isOk()) {
            return f(this.value);
        }
        return this;
    }
}

Result.prototype.toString = function() {
    return this.ok ? `Ok(${this.value})` : `Error(${this.error})`;
}

async function getTranscript(videoId) {
    return YoutubeTranscript.fetchTranscript(videoId)
        .then(Result.ok)
        .catch(Result.error);
}

function getExample(_) {
    return Result.ok([{text: "1"}, {text: "2"}, {text: "3"}]);
}

function unwrapTranscript(packedTranscript) {
    // The transcript is not one long string, but an array of objects
    // So we need to join them together
    let internalTranscript = "";
    for (let i = 0; i < packedTranscript.length; i++) {
        internalTranscript += packedTranscript[i].text;
        if (i < packedTranscript.length - 1) {
            internalTranscript += " ";
        }
    }
    return Result.ok(internalTranscript);
}

function verifyLength(transcript) {
    console.log(transcript.length);
    if (transcript.length > TRANSCRIPT_MAX_CHARS) {
        return Result.error("Transcript too long");
    } else {
        return Result.ok(transcript);
    }
}

function newPromptAppender(append) {
    return function(transcript) {
        return Result.ok(transcript + append);
    }
}

function newPromptPrepender(prepend) {
    return function(transcript) {
        return Result.ok(prepend + transcript);
    }
}

// Because we don't want to keep querying the API if we are only interested in fixing the backend
let DEBUG = false;
let DEBUG2 = true;

async function getSummary(transcript) {
    // We need to return both the original transcript and the result of the summarization
    // This is so that we can trim the transcript to the summary
    if (DEBUG2) {
        transcript = "Bacon and eggy goodness"
    }
    try {
        if (DEBUG) {
            return Result.ok({transcript: transcript, transcriptAndSummary: transcript + "ABCDEFG"});
        }
        let response = await fetch('https://wv0usdnw7l.execute-api.us-east-2.amazonaws.com/transcript-to-summary/generate', {
            method: 'POST',
            body: JSON.stringify(transcript),
        })
        .then(response => response.json())
        return Result.ok({transcript: transcript, transcriptAndSummary: response});
    } catch (error) {
        return Result.error(error);
    }
}

function extractSummary(transcriptWithResponse) {
    let transcript = transcriptWithResponse.transcript;
    let transcriptAndSummary = transcriptWithResponse.transcriptAndSummary;
    let summary = transcriptAndSummary.slice(transcript.length);
    return Result.ok(summary);
}

async function fullPipeline(videoId, willPrompt = false, prompter = null, append = null, prepend = null) {
    let internal_prompter = null;
    if (willPrompt) {
        if (prompter == null) {
            if (append != null) {
                internal_prompter = newPromptAppender(append);
            } else if (prepend != null) {
                internal_prompter = newPromptPrepender(prepend);
            } else {
                internal_prompter = newPromptAppender("\n TLDR: ");
            }
        } else {
            internal_prompter = prompter;
        }
        let transcript = await getTranscript(videoId);
        transcript = await transcript
            .flat_map(unwrapTranscript)
            .flat_map(verifyLength)
            .flat_map(internal_prompter)
            .flat_map(getSummary);
        // For some reason, if I don't break this up into two lines, Quokka cries.
        transcript = transcript.flat_map(extractSummary);
        return transcript
    } else {
        let transcript = await getTranscript(videoId);
        transcript = await transcript
            .flat_map(unwrapTranscript)
            .flat_map(verifyLength)
            .flat_map(getSummary);
        transcript = transcript.flat_map(extractSummary);
        return transcript
    }
}

async function fullPipelineNoPrompt(videoId) {
    let transcript = await getTranscript(videoId);
    transcript = transcript
        .flat_map(unwrapTranscript)
        .flat_map(verifyLength)
        .flat_map(getSummary);
    transcript = transcript.flat_map(extractSummary);
    return transcript
}

//console.log(Result.ok("Test").flat_map(newPromptAppender(" Success!")).unwrap());

//YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=Wlim-ZJIRD8').then(console.log);

fullPipeline('f-iae3jDvys', true).then(console.log);