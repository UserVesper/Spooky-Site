export async function getPontos() {
  const res = await fetch("http://localhost:5000/api/pontos");
  return res.json();
}