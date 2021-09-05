Hooks.on("renderJournalSheet", (app, html, data) => {
  //   console.log(app);
  //   console.log(html);
  //   console.log(data);

  const buildNextUntilSelector = (tag) => {
    let selector = "";
    let level = Number.parseInt(tag.slice(1), 10);
    for (; level > 0; level--) {
      selector += `h${level}`;
      if (level > 1) {
        selector += ",";
      }
    }
    return selector;
  };

  const headers = html.find(".editor").find("h1,h2,h3,h4,h5,h6");
  headers.each(function (_, html) {
    html.innerText = `!!! ${html.innerText}`;
    html.classList.add("cje-collapsible");
    const el = $(this);
    const _handleClick = () => {
      const childEls = el.nextUntil(buildNextUntilSelector(html.tagName));
      return () => {
        console.log("clicked!");
        console.log(el);
        console.log(childEls);
      };
    };
    el.on("click", _handleClick());
  });
});
