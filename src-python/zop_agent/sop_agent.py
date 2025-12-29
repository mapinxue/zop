"""
SOP Generator Agent.

This agent takes a user's process description and generates a structured SOP
with steps that can be converted into a flowchart.
"""

from pydantic import Field, BaseModel
from typing import Optional
import instructor
from instructor import Mode
import openai


class SopStep(BaseModel):
    """A single step in the SOP."""

    step_type: str = Field(
        ...,
        description="Type of step: 'start', 'read', 'form', or 'end'"
    )
    label: str = Field(
        ...,
        description="Short label for the step (2-5 words)"
    )
    content: Optional[str] = Field(
        default=None,
        description="Detailed content/description for read and form steps"
    )


class SopGeneratorOutputSchema(BaseModel):
    """Output schema for generated SOP."""

    title: str = Field(
        ...,
        description="Title of the SOP"
    )
    steps: list[SopStep] = Field(
        ...,
        description="List of steps in the SOP, starting with 'start' and ending with 'end'"
    )


class SopGeneratorAgent:
    """
    Agent that generates SOPs from natural language descriptions.
    Uses Instructor for structured output with Pydantic models.
    """

    def __init__(self, base_url: str, api_key: str, model_name: str):
        """
        Initialize the SOP Generator Agent.

        Args:
            base_url: OpenAI-compatible API base URL
            api_key: API key for authentication
            model_name: Model to use for generation
        """
        self.base_url = base_url
        self.api_key = api_key
        self.model_name = model_name

        # Create OpenAI client with custom base URL
        # Use JSON mode for better compatibility with various providers
        self.client = instructor.from_openai(
            openai.OpenAI(
                base_url=base_url,
                api_key=api_key,
            ),
            mode=Mode.JSON,  # Use JSON mode instead of function calling
        )

        # System prompt for SOP generation
        self.system_prompt = """You are an SOP (Standard Operating Procedure) generator.
Based on the user's description, generate a structured SOP with clear steps.

Rules:
1. Always start with a "start" step and end with an "end" step
2. Use "read" for information/instruction steps that users need to read
3. Use "form" for steps that require user input or action
4. Keep labels concise (2-5 words)
5. Content should be clear and actionable
6. Generate 4-10 steps typically
7. Make steps logical and sequential

You must respond with valid JSON matching this schema:
{
  "title": "string - Title of the SOP",
  "steps": [
    {
      "step_type": "start|read|form|end",
      "label": "string - Short label (2-5 words)",
      "content": "string or null - Detailed description"
    }
  ]
}"""

    def generate(self, prompt: str) -> SopGeneratorOutputSchema:
        """
        Generate an SOP from a natural language prompt.

        Args:
            prompt: User's description of the process

        Returns:
            SopGeneratorOutputSchema with title and steps
        """
        response = self.client.chat.completions.create(
            model=self.model_name,
            response_model=SopGeneratorOutputSchema,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
        )

        return response
