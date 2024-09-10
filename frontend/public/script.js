document.addEventListener("DOMContentLoaded", () => {
  const textForm = document.getElementById("textForm"); //we catch the form to add evenListener
  const textResponseDiv = document.getElementById("textResponse"); // we catch div to insert coming answer from api

  const imageForm = document.getElementById("imageForm");
  const imageResponseDiv = document.getElementById("imageResponse");

  const imageToTextForm = document.getElementById("imageToTextForm");
  const imageToTextResponseDiv = document.getElementById("imageToTextResponse");

  const imageToImageForm = document.getElementById("imageToImageForm");
  const imageToImageResponseDiv = document.getElementById(
    "imageToImageResponse"
  );

  const textToSpeechForm = document.getElementById("textToSpeechForm");

  const speechToTextForm = document.getElementById("speechToTextForm");
  const speechToTextResponseDiv = document.getElementById(
    "speechToTextResponse"
  );

  textForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const textPrompt = document.getElementById("textPrompt").value;

    try {
      // Send the prompt to the backend
      const textResponse = await fetch("/api/handle-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ textPrompt }),
      });

      // Parse the JSON response from the backend
      const data = await textResponse.json();

      const formattedResponse = data.data.replace(/\n/g, "<br>");
      const message = data.message;

      textResponseDiv.innerHTML = `
                <p>${message}</p>
                <pre>${formattedResponse}</pre>`;
    } catch (error) {
      console.error("Error:", error);
      textResponseDiv.innerHTML = `<p>Something went wrong. Please try again.</p>`;
    }
  });

  imageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const imagePrompt = document.getElementById("imagePrompt").value;
    if (!imagePrompt) {
      alert("please write your prompt.");
      return;
    }

    try {
      const imageResponse = await fetch("/api/text-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePrompt }), //we send as json string and receive as json object.HTTP protocol only works with json string.
      });

      const imageData = await imageResponse.json(); //we convert it to json object to manipulate the key-value pairs. Because HTTP only transmits text, and we cant access keys in json string.

      imageResponseDiv.innerHTML = `<img src="${imageData.imageUrl}" alt="Generated Image">`;
      console.log(imageData.message);
    } catch (error) {
      console.error("Error:", error);
      imageResponseDiv.innerHTML = `<p>Something went wrong. Please try again.</p>`;
    }
  });

  imageToTextForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = document.getElementById("imageTotextPrompt").files[0]; //we catch the image file from the user, files[0] user can select only one file.
    if (!file) {
      //if file doesnt exist
      alert("Please upload an image.");
      return;
    }

    // Check if the file is a PNG and less than 4MB
    if (file.type !== "image/jpeg") {
      alert("Please upload a JPEG image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      // 4MB in bytes
      alert("The image size should be less than 4MB.");
      return;
    }

    // Convert the file to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result.split(",")[1]; // Get Base64 string from data URL

      try {
        // Send the Base64 string to the backend
        const response = await fetch("/api/image-to-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Image }),
        });

        // Parse the JSON response from the backend
        const data = await response.json();

        // Display the response
        imageToTextResponseDiv.innerHTML = `<p>${data.message}</p>`;
      } catch (error) {
        console.error("Error:", error);
        imageToTextResponseDiv.innerHTML = `<p>Something went wrong. Please try again.</p>`;
      }
    };

    // Read the file as a data URL (Base64)
    reader.readAsDataURL(file);
  });

  imageToImageForm;

  textToSpeechForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way (trad)

    const textInput = document.getElementById("textToSpeechPrompt").value;

    try {
      // Send the text to the backend
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textInput }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Parse the JSON response from the backend
      const data = await response.json(); //we convert it to json object so use whats inside.
      const audioUrl = data.audioUrl; //we get binary data from openai and convert it to url on our local

      // Create an audio element and play the audio
      const audioElement = document.createElement("audio"); //created audio element
      audioElement.src = audioUrl; //assigned the source to coming url from openai api
      audioElement.controls = true; // Show controls for play/pause

      document.getElementById("textToSpeechResponse").innerHTML = ""; // Clear previous
      content
      document.getElementById("textToSpeechResponse").appendChild(audioElement);
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("textToSpeechResponse").innerHTML =
        "<p>Something went wrong. Please try again.</p>";
    }
  });

  speechToTextForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = document.getElementById("speechToTextPrompt").files[0];

    if (!file) {
      //if file doesnt exist
      alert("Please upload a sound file.");
      return;
    }

    const allowedFormats = [
      "flac",
      "mp3",
      "mp4",
      "mpeg",
      "mpga",
      "m4a",
      "ogg",
      "wav",
      "webm",
    ];
    const fileExtension = file.name.split(".").pop().toLowerCase(); // Get file extension

    if (!allowedFormats.includes(fileExtension)) {
      alert("Invalid file format. Please upload a valid audio file.");
      return;
    }
    const formData = new FormData();
    formData.append("audio", file);

    try {
      // Send the audio file to the backend
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error in speech-to-text processing");
      }

      // Get the transcription result from the server
      const result = await response.json();

      speechToTextResponseDiv.innerHTML = `<p>Transcription: ${result.text}</p>`;
    } catch (error) {
      console.error("Error:", error);
      speechToTextResponseDiv.innerHTML = `<p>Something went wrong. Please try again.</p>`;
    }
  });
});
