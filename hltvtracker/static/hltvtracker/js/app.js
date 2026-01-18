const ASYNC_MODE = true;

(function () {
  const commentsArea = document.querySelector("#comments-area");
  const commentList = document.querySelector("#comment-list");
  const commentForm = document.querySelector("#comment-form");
  const feedbackBox = document.querySelector("#comment-feedback");

  if (!commentsArea || !commentList) return;

  const commentsUrl = commentsArea.dataset.commentsUrl;

  const showFeedback = (text, tone = "info") => {
    if (!feedbackBox) return;
    feedbackBox.textContent = text;
    feedbackBox.dataset.tone = tone;
  };

  const getCsrfToken = () => {
    const tokenInput = commentForm?.querySelector("input[name='csrfmiddlewaretoken']");
    if (tokenInput) return tokenInput.value;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
  };

  const renderEmpty = () => {
    commentList.replaceChildren();
    const empty = document.createElement("p");
    empty.className = "no-comments";
    empty.textContent = "Aucun commentaire pour le moment.";
    commentList.appendChild(empty);
  };

  const renderComment = (comment) => {
    const item = document.createElement("div");
    item.className = "comment-item";

    const header = document.createElement("div");
    header.className = "comment-header";

    const author = document.createElement("span");
    author.className = "comment-author";
    author.textContent = comment.username;

    const date = document.createElement("span");
    date.className = "comment-date";
    date.textContent = comment.created_at || "Date inconnue";

    const actions = document.createElement("div");
    actions.className = "comment-actions";

    const editLink = document.createElement("a");
    editLink.className = "edit-link";
    editLink.href = `/comment/${comment.id}/edit/`;
    editLink.textContent = "Modifier";

    const deleteForm = document.createElement("form");
    deleteForm.className = "delete-form";
    deleteForm.method = "post";
    deleteForm.action = `/comment/${comment.id}/delete/`;
    deleteForm.style.display = "inline";

    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrfmiddlewaretoken";
    csrfInput.value = getCsrfToken();

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-link";
    deleteButton.type = "submit";
    deleteButton.textContent = "Supprimer";

    deleteForm.append(csrfInput, deleteButton);
    actions.append(editLink, deleteForm);

    header.append(author, date, actions);

    const text = document.createElement("p");
    text.className = "comment-text";
    text.textContent = comment.text;

    item.append(header, text);
    commentList.appendChild(item);
  };

  function xhrRequest(url, { method = "GET", headers = {}, body = null } = {}) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, ASYNC_MODE);

    for (const k in headers) xhr.setRequestHeader(k, headers[k]);

    const t0 = performance.now();
    setTimeout(() => {
      console.log(`[Timer 0] ${(performance.now() - t0).toFixed(0)}ms (retard si SYNC)`);
    }, 0);

    const parseJson = () => {
      try { return xhr.responseText ? JSON.parse(xhr.responseText) : {}; }
      catch { return {}; }
    };

    if (ASYNC_MODE) {
      return new Promise((resolve) => {
        xhr.onload = () => {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            data: parseJson(),
          });
        };
        xhr.onerror = () => resolve({ ok: false, status: 0, statusText: "Network Error", data: {} });
        xhr.send(body);
      });
    }

    // SYNC: freeze ici
    xhr.send(body);
    console.log(`[XHR] ${method} ${url} -> ${xhr.status} in ${(performance.now() - t0).toFixed(0)}ms (SYNC)`);
    return Promise.resolve({
      ok: xhr.status >= 200 && xhr.status < 300,
      status: xhr.status,
      statusText: xhr.statusText,
      data: parseJson(),
    });
  }

  async function fetchComments() {
    showFeedback("Chargement...", "info");
    const res = await xhrRequest(commentsUrl, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      showFeedback("Impossible de charger les commentaires.", "error");
      return;
    }

    const comments = res.data.comments || [];
    commentList.replaceChildren();

    if (comments.length === 0) return renderEmpty();
    comments.forEach(renderComment);

    showFeedback(`Commentaires mis à jour (${comments.length})`, "success");
  }

  async function submitComment(event) {
    event.preventDefault();

    const formData = new FormData(commentForm);
    const payload = {
      username: (formData.get("username") || "").toString().trim(),
      text: (formData.get("text") || "").toString().trim(),
    };

    if (!payload.username || !payload.text) {
      showFeedback("Merci de compléter les deux champs.", "error");
      return;
    }

    showFeedback("Envoi...", "info");

    const res = await xhrRequest(commentsUrl, {
      method: "POST",
      headers: {        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      showFeedback("Erreur lors de l'envoi.", "error");
      return;
    }

    if (res.data.errors) {
      const msg = Object.values(res.data.errors).flat().join(" / ");
      showFeedback(msg || "Erreur lors de l'envoi.", "error");
      return;
    }

    showFeedback("Commentaire enregistré.", "success");
    commentForm.reset();
    await fetchComments();
  }

  commentForm?.addEventListener("submit", submitComment);
  fetchComments();
})();
