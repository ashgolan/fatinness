// client/src/pages/DebugApi.jsx
import React, { useEffect, useState } from "react";
import { Api } from "../api/Api";

export default function DebugApi() {
  const [result, setResult] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [extraTests, setExtraTests] = useState({});

  const BASE = "https://fateness-production.up.railway.app";

  useEffect(() => {
    const start = performance.now();

    Api.get("/health")
      .then((res) => {
        const time = performance.now() - start;
        setResult({ data: res.data, time: `${time.toFixed(2)}ms` });
      })
      .catch((err) => {
        const time = performance.now() - start;

        setErrorInfo({
          message: err.message,
          code: err.code,
          name: err.name,
          stack: err.stack,
          toJSON: err.toJSON ? err.toJSON() : null,
          responseStatus: err.response?.status,
          responseHeaders: err.response?.headers,
          responseData: err.response?.data,
          config: err.config,
          time: `${time.toFixed(2)}ms`,
        });
      });

    // Additional diagnostics
    runExtraTests(BASE);
  }, []);

  const runExtraTests = async (url) => {
    const tests = {};

    // Test 1: Fetch native
    try {
      const res = await fetch(url + "/health");
      tests.fetchStatus = res.status;
      tests.fetchJson = await res.json().catch(() => "Not JSON");
    } catch (e) {
      tests.fetchError = e.toString();
    }

    // Test 2: Check if running in Android WebView
    tests.userAgent = navigator.userAgent;
    tests.isWebView =
      /wv/.test(navigator.userAgent.toLowerCase()) ||
      /version\/\d+\.\d+/.test(navigator.userAgent.toLowerCase());

    // Test 3: Check Origin
    tests.origin = window.location.origin;

    // Test 4: DNS lookup via image
    try {
      const img = new Image();
      img.src = url + "/health?" + Date.now();
      img.onload = () => {
        tests.dnsImage = "Image loaded (DNS OK)";
        setExtraTests({ ...tests });
      };
      img.onerror = () => {
        tests.dnsImage = "Image failed (DNS/SSL blocked)";
        setExtraTests({ ...tests });
      };
    } catch (e) {
      tests.dnsImage = e.toString();
    }

    setExtraTests(tests);
  };

  return (
    <div style={{ padding: 16, direction: "ltr", fontFamily: "monospace" }}>
      <h2>API Debug</h2>

      <h3>Axios Result</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>

      <h3>Axios Error</h3>
      <pre>{JSON.stringify(errorInfo, null, 2)}</pre>

      <h3>Extra Tests</h3>
      <pre>{JSON.stringify(extraTests, null, 2)}</pre>
    </div>
  );
}
