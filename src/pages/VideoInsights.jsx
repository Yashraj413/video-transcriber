import React, { useRef, useState } from "react";
import { pipeline } from "@xenova/transformers";

const VideoInsights = () => {
  const fileInputRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setVideoFile(file);

    setVideoUrl(URL.createObjectURL(file));

    setResult(null);

    setError("");
  };

  const analyzeSentiment = (text) => {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "love",
      "amazing",
      "awesome",
      "perfect",
      "best",
      "beautiful",
      "nice",
    ];

    const negativeWords = [
      "bad",
      "worst",
      "poor",
      "hate",
      "terrible",
      "awful",
      "problem",
      "expensive",
      "boring",
      "disappointed",
    ];

    let positive = 0;
    let negative = 0;

    const lower = text.toLowerCase();

    positiveWords.forEach((word) => {
      if (lower.includes(word)) positive++;
    });

    negativeWords.forEach((word) => {
      if (lower.includes(word)) negative++;
    });

    return {
      positive:
        positive > 0
          ? "Positive sentiment detected in this review."
          : null,

      negative:
        negative > 0
          ? "Negative sentiment detected in this review."
          : null,
    };
  };

  const summarizeText = (text) => {
    if (!text) return "";

    const sentences = text.split(".");

    return (
      sentences.slice(0, 3).join(".") + "."
    );
  };

  const extractAudioData = async (file) => {
    const audioContext = new AudioContext();

    const video = document.createElement("video");

    video.src = URL.createObjectURL(file);

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    const response = await fetch(video.src);

    const arrayBuffer =
      await response.arrayBuffer();

    const audioBuffer =
      await audioContext.decodeAudioData(
        arrayBuffer
      );

    return Float32Array.from(
      audioBuffer.getChannelData(0)
    );
  };

  const handleAnalyze = async () => {
    if (!videoFile) {
      setError(
        "Please upload a video first."
      );

      return;
    }

    try {
      setLoading(true);

      setError("");

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en"
      );

      const audio =
        await extractAudioData(videoFile);

      const output =
        await transcriber(audio);

      const transcript =
        output.text ||
        "No transcript generated.";

      const sentiment =
        analyzeSentiment(transcript);

      setResult({
        transcript_text: transcript,

        summary:
          summarizeText(transcript),

        positive_review:
          sentiment.positive,

        negative_review:
          sentiment.negative,

        language: "en",
      });
    } catch (err) {
      console.error(err);

      setError(
        "Failed to transcribe video. Try another file."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="title">
          Upload Video Reviews
        </h1>

        <p className="subtitle">
          AI transcription and sentiment
          insights.
        </p>

        <div className="card">
          <div className="upload-header">
            <div>
              <h3 className="section-title">
                Upload your review video
              </h3>
            </div>
          </div>

          <div className="upload-row">
            <button
              className="btn-primary"
              onClick={handleChooseFile}
            >
              Upload Video
            </button>

            <span className="filename-chip">
              {videoFile
                ? videoFile.name
                : "No file selected"}
            </span>

            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <button
            className="btn-primary analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading
              ? "Generating Transcript..."
              : "Analyze Review"}
          </button>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="divider">
            <h3 className="section-title">
              Uploaded Video Preview
            </h3>

            <div className="preview-wrapper">
              {videoUrl ? (
                <video
                  controls
                  src={videoUrl}
                  className="video-player"
                />
              ) : (
                <div className="video-placeholder">
                  Video preview appears here
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-shell">
            <div className="loader"></div>

            <p>
              AI is transcribing your
              video...
            </p>
          </div>
        )}

        {result && (
          <div className="result-stack">
            <div className="card">
              <p className="summary-kicker">
                AI GENERATED SUMMARY
              </p>

              <div className="summary-text">
                {result.summary}
              </div>

              <div className="meta-text">
                Language: {result.language}
              </div>
            </div>

            <div className="sentiment-grid">
              {result.positive_review && (
                <div className="positive-card">
                  <h3 className="positive-title">
                    Positive Review
                  </h3>

                  <div className="positive-copy">
                    {
                      result.positive_review
                    }
                  </div>
                </div>
              )}

              {result.negative_review && (
                <div className="negative-card">
                  <h3 className="negative-title">
                    Negative Review
                  </h3>

                  <div className="negative-copy">
                    {
                      result.negative_review
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="transcript-card">
              <div className="transcript-header">
                <h3>
                  Full Transcript
                </h3>

                <span className="live-badge">
                  Generated
                </span>
              </div>

              <div className="transcript-body">
                {result.transcript_text}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VideoInsights;