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
      "cjeh-d-none"
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

const injectCollapsibleHeaders = (app, html, data, renderHeadersCollapsed) => {
  const editor = html.find(".editor");
  let allCollapsed = renderHeadersCollapsed;

  const headers = editor.find("h1,h2,h3,h4,h5,h6");
  headers.each(function (idx, html) {
    const id = `cjeh-${idx}`;
    html.dataset.cjeId = id;
    html.classList.add("cjeh-collapsible");
    const el = $(this);
    el.html(
      `<i data-feather='plus-circle'></i><i data-feather='minus-circle'></i>${el.html()}`
    );
    const childEls = collectChildElements(
      html,
      buildNextUntilSelector(html.tagName)
    );
    const _handleClick = () => {
      const header = headerIdMap[id];
      header.isOpen = !header.isOpen;
      header.el[0].classList[header.isOpen ? "remove" : "add"](
        "cjeh-collapsed"
      );
      childElRecursion(header, header.isOpen);

      if (header.isOpen) {
        allCollapsed = false;
      } else {
        allCollapsed = true;
        for (const id in headerIdMap) {
          if (headerIdMap[id].isOpen) {
            allCollapsed = false;
            break;
          }
        }
      }
      editor[allCollapsed ? "addClass" : "removeClass"]("cjeh-all-collapsed");
    };
    headerIdMap[id] = {
      el,
      childEls,
      _handleClick,
      isOpen: true,
    };
    el.on("click", _handleClick);
    if (renderHeadersCollapsed) {
      _handleClick();
    }
  });

  const editorExpand = $(`
    <a class="editor-expand">
      <i class="fa fa-expand-alt" aria-hidden="true"></i>
    </a>`);
  const editorCompress = $(`
    <a class="editor-compress">
      <i class="fa fa-compress-alt" aria-hidden="true"></i>
    </a>`);
  editor.append(editorExpand, editorCompress);
  if (allCollapsed) {
    editor.addClass("cjeh-all-collapsed");
  }
  const toggleAll = (collapse) => {
    for (const id in headerIdMap) {
      const header = headerIdMap[id];
      if (header.isOpen === collapse) {
        header._handleClick();
      }
    }
  };
  editorExpand.on("click", () => {
    toggleAll(false);
  });
  editorCompress.on("click", () => {
    toggleAll(true);
  });

  feather.replace();
};

Hooks.on("init", () => {
  let renderJournalSheetHookId = null;

  game.settings.register(
    "foundry-vtt-collapsible-journal-entry-headers",
    "enableCollapsbibleHeaders",
    {
      name: "Enable Collapsible Headers",
      hint: "Choose whether to enable collapsible headers",
      scope: "client", // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: Boolean,
      choices: {
        // If choices are defined, the resulting setting will be a select menu
        true: "Yes",
        false: "No",
      },
      default: true, // The default value for the setting
      onChange: (value) => {
        if (value) {
          renderJournalSheetHookId = Hooks.on(
            "renderJournalSheet",
            (app, html, data) => {
              injectCollapsibleHeaders(app, html, data);
            }
          );
          return;
        }
        Hooks.off("renderJournalSheet", renderJournalSheetHookId);
      },
    }
  );

  game.settings.register(
    "foundry-vtt-collapsible-journal-entry-headers",
    "renderHeadersCollapsed",
    {
      name: "Render Headers Collapsed",
      hint: "Choose whether to render headers collapsed",
      scope: "client", // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: Boolean,
      choices: {
        // If choices are defined, the resulting setting will be a select menu
        true: "Yes",
        false: "No",
      },
      default: false, // The default value for the setting
    }
  );

  if (
    game.settings.get(
      "foundry-vtt-collapsible-journal-entry-headers",
      "enableCollapsbibleHeaders"
    )
  ) {
    renderJournalSheetHookId = Hooks.on(
      "renderJournalSheet",
      (app, html, data) => {
        injectCollapsibleHeaders(
          app,
          html,
          data,
          game.settings.get(
            "foundry-vtt-collapsible-journal-entry-headers",
            "renderHeadersCollapsed"
          )
        );
      }
    );
  }

  Hooks.on("closeJournalSheet", () => {
    headerIdMap = {};
  });
});
