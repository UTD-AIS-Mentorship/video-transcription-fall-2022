import re
from transformers import pipeline
from typing import TypeVar
from youtube_transcript_api import YouTubeTranscriptApi


# Model type providing a basic interface for calling the model, without worrying about the details
# of the model's architecture
class SimpleModel:
    # model can be any model that generates text
    # func must take a model and a string and return a string
    def __init__(self, model, func):
        self.model = model
        self.func = func

    def __call__(self, string):
        return self.func(self.model, string)


# Result-like class inspired by Rust
class Result:
    def __init__(self, ok: bool, value=None, error: str = ""):
        self.ok = ok
        # If the result is ok, set the value. Otherwise, set the error
        self.value = value if ok else None
        self.error = error if not ok else ""

    def __str__(self):
        # If the result is ok, return the value. Otherwise, return the error
        return f"Ok: {self.value}" if self.ok else f"Err: {self.error}"

    def __repr__(self):
        return str(self)

    def is_ok(self):
        return self.ok

    def is_err(self):
        return not self.ok

    def unwrap(self):
        if self.is_ok():
            return self.value
        else:
            raise Exception(self.error)

    def match(self, ok_func, err_func):
        if self.is_ok():
            return ok_func(self.value)
        else:
            return err_func(self.error)

    # func must return a Result
    def flat_map(self, func):
        if self.is_ok():
            return func(self.value)
        else:
            return self


is_youtube_regex = re.compile(r"(?:https?://)?(www\.)?youtu(?:be\.com|\.be).*")


def is_youtube(link: str) -> bool:
    """Check if link is a YouTube link"""
    return is_youtube_regex.match(link) is not None


youtube_video_id_regex = re.compile(
    r"(?:https?://)?"
    r"(?:(?:www\.)?youtube\.com/watch\?v=|m\.youtube\.com/watch\?v=|youtu\.be/)"
    r"([0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]).*"
)


def get_youtube_video_id(link: str) -> Result:
    """Get the video id from a YouTube link"""
    if not is_youtube(link):
        return Result(False, error="Not a youtube link")
    match = youtube_video_id_regex.match(link)
    if match is None:
        return Result(False, error="Invalid youtube link")
    return Result(True, value=match.group(1))


def get_transcript(video_id: str) -> Result:
    try:
        text = YouTubeTranscriptApi.get_transcript(video_id)
        # We need to transform the transcript into a string
        return Result(True, value=" ".join([line["text"] for line in text]))
    except Exception as e:
        return Result(False, error=str(e))


def get_summary(text: str, model: SimpleModel, prompter) -> Result:
    # Prompter must be a function that takes a string and returns a string
    # You can use simple_prompter to get a simple prompter
    try:
        prompt = prompter(text)
        return Result(True, model(prompt))
    except Exception as e:
        return Result(False, error=str(e))


def link_to_summary_prompter(link: str, gen, prompter) -> Result:
    return get_youtube_video_id(link) \
        .flat_map(get_transcript) \
        .flat_map(lambda text: get_summary(text, gen, prompter))


def link_to_summary_string(link: str, gen, string) -> Result:
    prompter = lambda x: x + string
    return get_youtube_video_id(link) \
        .flat_map(get_transcript) \
        .flat_map(lambda text: get_summary(text, gen, prompter))


def link_to_summary_simple(link: str, gen) -> Result:
    prompter = lambda x: x + "\n TLDR: "
    return get_youtube_video_id(link) \
        .flat_map(get_transcript) \
        .flat_map(lambda text: get_summary(text, gen, prompter))


def link_to_transcript(link: str) -> Result:
    return get_youtube_video_id(link) \
        .flat_map(get_transcript)


def link_to_prompt(link: str, prompter) -> Result:
    return get_youtube_video_id(link) \
        .flat_map(get_transcript) \
        .flat_map(lambda text: Result(True, value=prompter(text)))


def unwrap_result(result: Result):
    if result.is_ok():
        return result.value
    else:
        raise Exception(result.error)


# Convenience functions for prompts
# This returns a simple lambda that takes a string and returns a string
def simple_prompter(text: str):
    return lambda x: x + text


def main():
    model = SimpleModel(
        pipeline('text-generation', model='EleutherAI/gpt-neo-125M'),
        lambda mdl, prompt:
        mdl(prompt, do_sample=True, temperature=0.9, max_new_tokens=200)[0]["generated_text"][len(prompt):].strip()
    )
    link = input("Enter a youtube link: ")
    prompter = lambda x: x + "\n TLDR: "
    result = link_to_summary(link, model, prompter)
    print(result)


if __name__ == "__main__":
    main()
