let headerIdMap = {};

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

const childElRecursion = ({ childEls, isOpen }, topIsOpen) => {
  childEls.forEach((childHtml) => {
    childHtml.classList[topIsOpen ? (isOpen ? "remove" : "add") : "add"](
      "cje-d-none"
    );
    if (childHtml.dataset.cjeId) {
      childElRecursion(headerIdMap[childHtml.dataset.cjeId], topIsOpen);
    }
  });
};

const collectChildElements = (el, selector) => {
  const headerTags = { H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1 };
  const siblings = [];
  let foundSubHeader = "";
  el = el.nextElementSibling;

  while (el) {
    if (el.matches(selector)) {
      break;
    }

    if (!foundSubHeader) {
      if (headerTags[el.tagName]) {
        foundSubHeader = el.tagName;
      }
      siblings.push(el);
    } else if (el.tagName === foundSubHeader) {
      siblings.push(el);
    }

    el = el.nextElementSibling;
  }

  return siblings;
};

Hooks.on("closeJournalSheet", () => {
  headerIdMap = {};
});

Hooks.on("renderJournalSheet", (app, html, data) => {
  const headers = html.find(".editor").find("h1,h2,h3,h4,h5,h6");
  headers.each(function (idx, html) {
    const id = `cje-${idx}`;
    html.dataset.cjeId = id;
    html.classList.add("cje-collapsible");
    const el = $(this);
    console.log(el.html());
    el.html(
      `<i data-feather='plus-circle'></i><i data-feather='minus-circle'></i>${el.html()}`
    );
    const childEls = collectChildElements(
      html,
      buildNextUntilSelector(html.tagName)
    );
    const _handleClick = () => {
      headerIdMap[id].isOpen = !headerIdMap[id].isOpen;
      headerIdMap[id].el[0].classList[
        headerIdMap[id].isOpen ? "remove" : "add"
      ]("cje-collapsed");
      childElRecursion(headerIdMap[id], headerIdMap[id].isOpen);
    };
    headerIdMap[id] = {
      el,
      childEls,
      _handleClick,
      isOpen: true, // TODO
    };
    el.on("click", _handleClick);
  });
  feather.replace();
});
