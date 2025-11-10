// script.js
async function login(username, password) {
  const res = await fetch("https://senin-site.onrender.com/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.token) localStorage.setItem("token", data.token);
}

async function getMe() {
  const token = localStorage.getItem("token");
  const res = await fetch("https://senin-site.onrender.com/api/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(data);
}
