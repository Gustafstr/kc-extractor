
import os
import sys
import ssl
from pathlib import Path

# Set the API key
os.environ['DATALAB_API_KEY'] = 'AFJQ6KEb3uGhJaCOGVdALm83Qb8R0Ij4EcuihF4nQq4'

# Handle SSL certificate issues on macOS
try:
    import certifi
    os.environ['SSL_CERT_FILE'] = certifi.where()
except ImportError:
    pass

# Disable SSL verification as a fallback (not recommended for production)
ssl._create_default_https_context = ssl._create_unverified_context

try:
    from datalab_sdk import DatalabClient
    from datalab_sdk.models import ConvertOptions
except ImportError as e:
    print("Error: Datalab SDK not installed. Install with: pip install datalab-python-sdk", file=sys.stderr)
    sys.exit(1)

def convert_single_file():
    try:
        # Initialize client
        client = DatalabClient()
        
        # Set up conversion options
        options = ConvertOptions(
            output_format="markdown",
            force_ocr=False,
            use_llm=False,
            paginate=False,
        )
        
        # Convert the file
        input_file = Path('/Users/gustafstrauss/Development/kc-extractor/src/mastra/Input/PDFs/temp_conversion/input/Feedback Case Study 2023-2024 (1).pdf')
        result = client.convert(str(input_file), options=options)
        
        # Get markdown content
        markdown_text = None
        for attr in ("markdown", "md", "content", "text"):
            if hasattr(result, attr):
                markdown_text = getattr(result, attr)
                break
        
        if markdown_text is None:
            print("Error: SDK result did not include markdown content.", file=sys.stderr)
            sys.exit(1)
        
        # Write to output file
        output_file = Path('/Users/gustafstrauss/Development/kc-extractor/src/mastra/Input/Converted/Feedback Case Study 2023-2024 (1).md')
        output_file.write_text(markdown_text, encoding='utf-8')
        
        print(f"SUCCESS:{len(markdown_text)}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    convert_single_file()
