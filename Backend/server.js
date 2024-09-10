require('dotenv').config();

// Import the express library
const express = require("express");
const path = require("path"); // Import the path module for resolving file paths
const axios = require("axios");
const formidable = require("formidable"); // Formidable to handle FormData
const fs = require("fs");
const FormData = require("form-data");

const apiKey = `Bearer ${process.env.openAiKey}`;


// Create an instance of the express application
const app = express();

// Define the port number to listen on
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static(__dirname)); // Serve static files from the root directory

// Serve static files (e.g., your HTML, CSS, and JS files)
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Serve the index.html file on the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "index.html"));
});

app.post("/api/handle-prompt", async (req, res) => {
  try {
    const { textPrompt } = req.body; //extracts prompt from the body, {} expression takes the value inside json

    // Call the OpenAI API
    const openAiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: textPrompt }],
        max_tokens: 50, //to control the length of the response.
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(openAiResponse.data.choices[0].message.content);

    // Send response back to the client
    res.json({
      message: "Prompt processed successfully",
      data: openAiResponse.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/text-image", async (req, res) => {
  try {
    const { imagePrompt } = req.body; // Extract the image prompt from the request body. It's sent as json string but express.js automatically converts it to json object. this middleware => express.json()

    console.log(imagePrompt); // Log the image prompt for debugging

    // Make an asynchronous POST request to the OpenAI API
    const openAiResponse = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        model: "dall-e-3", // Specify the model to use (DALL-E 3 in this case)
        prompt: imagePrompt, // The prompt for generating the image
        n: 1, // Number of images to generate
        size: "1024x1024", // Size of the generated image
      },
      {
        headers: {
          "Content-Type": "application/json", // Set content type to JSON
          Authorization: apiKey, // Set the API key for authorization
        },
      }
    );

    // Extract the URL of the generated image from the response
    const imageUrl = openAiResponse.data.data[0].url;

    // Send a JSON response back to the client with the image URL
    res.json({
      message: "Image generated successfully", // Success message
      imageUrl: imageUrl, // URL of the generated image
    });
  } catch (error) {
    // Log any errors that occur during the request
    console.error("Error:", error.message);

    // Send a 500 status code with an error message if something goes wrong
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/image-to-text", async (req, res) => {
  try {
    // Extract the Base64-encoded image from the request body
    const base64Image = req.body.image; // The image should be sent in Base64 format

    // Prepare the payload for OpenAI API
    const payload = {
      //the data to send to API
      model: "gpt-4o-mini", // Specify the model or use an appropriate model for image understanding
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What’s in this image?",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    };

    // Make a POST request to OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
      }
    );

    // Extract and send the response data back to the client
    const description = response.data.choices[0].message.content;
    res.json({ message: description });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/text-to-speech", async (req, res) => {
  try {
    // Extract input text from the request body
    const { text } = req.body;

    // Define request headers and payload
    const headers = {
      Authorization: apiKey,
      "Content-Type": "application/json",
    };

    const payload = {
      model: "tts-1", // Change this to the correct model name if different
      input: text,
      voice: "alloy", // Use the appropriate voice model
    };

    // Send POST request to OpenAI API
    const openAiResponse = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      payload,
      { headers, responseType: "arraybuffer" }
    );

    const fileName = `output_${new Date().getTime()}.mp3`; //defines the file name that will be generated in the future

    // Define the path where the MP3 file will be saved
    const filePath = path.join(__dirname, "audio", fileName); //it takes 3 parameters, _dirname is the current folder where the script is in place, second is the subfolder, third is the file will be placed there.

    //fs.writeFile is used to write data to a file. First argument "filePath is the path and the name of the file." 2. is the data to write on that file.
    fs.writeFile(filePath, openAiResponse.data, (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Send the URL of the MP3 file back to the client
      res.json({
        audioUrl: `/audio/${fileName}`,
      });
    });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred while processing the request." });
  }
});

app.post("/api/speech-to-text", async (req, res) => {
  // Create a new instance of the formidable form parser
  const form = new formidable.IncomingForm();

  // Parse the incoming form data (the audio file from the frontend)
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form data:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    // Check if the audio file is present in the uploaded files
    if (!files.audio) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const audioFile = files.audio[0]; // Extract the uploaded file

    console.log("Received file:", {
      name: audioFile.originalFilename,
      type: audioFile.mimetype,
      size: audioFile.size,
    });

    // Optional: Check file size (5MB limit in this case)
    if (audioFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File size exceeds limit" });
    }

    try {
      // Create a FormData instance to build the multipart request
      const formData = new FormData();

      // Log the file path
      console.log("File path:", audioFile.filepath);

      // Check if the file exists and is readable
      try {
        await fs.promises.access(audioFile.filepath, fs.constants.R_OK);
        console.log("File is accessible and readable");
      } catch (error) {
        console.error("File is not accessible:", error);
        return res
          .status(500)
          .json({ message: "Error accessing the audio file" });
      }

      formData.append("file", fs.createReadStream(audioFile.filepath)); // Attach the file as a stream
      formData.append("model", "whisper-1"); // Specify the Whisper model
      formData.append("response_format", "json"); // Expect JSON response
      formData.append("language", fields.language || "en"); // Optional: Specify the language (default to English)

      console.log("FormData headers:", formData.getHeaders());

      // Make the POST request to OpenAI's transcription API
      const openAiResponse = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            Authorization: apiKey, // API key for authorization
            ...formData.getHeaders(), // Required multipart/form-data headers
          },
        }
      );

      // Extract the transcription from the response
      const transcription = openAiResponse.data.text;

      // Send the transcription result back to the frontend
      res.json({ text: transcription });
    } catch (error) {
      console.error("Detailed error:", {
        message: error.message,
        stack: error.stack,
        response: error.response
          ? {
              data: error.response.data,
              status: error.response.status,
              headers: error.response.headers,
            }
          : "No response",
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Log that the server is running
});
