(async () => {
  const headerElement = document.getElementById("header");

  // Caminhos relativos a /home/
  const htmlPath = "/src/item/item.html";
  const cssPath = "/src/item/item.css";

  // Carrega e insere o CSS
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssPath;
  document.head.appendChild(link);

  // Carrega e insere o HTML
  const response = await fetch(htmlPath);
  const html = await response.text();
  headerElement.innerHTML = html;
})();
