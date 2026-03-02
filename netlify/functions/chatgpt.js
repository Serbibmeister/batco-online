// netlify/functions/chatgpt.js  (temporary test)
export const handler = async (event) => {
  try {
    // Return the incoming payload to verify the function receives the request
    const body = event.body ? JSON.parse(event.body) : {};
    return {
      statusCode: 200,
      body: JSON.stringify({ raw: "TEST_OK: function invoked", received: body }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
