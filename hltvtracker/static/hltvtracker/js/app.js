/**
 * Configuration de l'asynchronisme
 * Changez cette valeur pour tester le comportement synchrone (false) ou asynchrone (true)
 * - true (asynchrone) : Les requêtes ne bloquent pas l'interface utilisateur
 * - false (synchrone) : Les requêtes bloquent l'interface jusqu'à la réponse (déconseillé en production)
 */
const ASYNC_MODE = true;

(function () {
  const commentsArea = document.querySelector("#comments-area");
  const commentList = document.querySelector("#comment-list");
  const commentForm = document.querySelector("#comment-form");
  const feedbackBox = document.querySelector("#comment-feedback");

  if (!commentsArea || !commentList) {
    return;
  }

  const commentsUrl = commentsArea.dataset.commentsUrl;

  const showFeedback = (text, tone = "info") => {
    if (!feedbackBox) return;
    feedbackBox.textContent = text;
    feedbackBox.dataset.tone = tone;
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

    // Indicateur de sentiment (calculé côté client)
    const sentiment = comment.sentiment || 'NEUTRAL';
    const sentimentEmoji = sentiment === 'POSITIVE' ? '😊' : sentiment === 'NEGATIVE' ? '😞' : '😐';
    const sentimentColor = `sentiment-${sentiment.toLowerCase()}`;

    const sentimentIndicator = document.createElement("span");
    sentimentIndicator.className = `sentiment-indicator ${sentimentColor}`;
    sentimentIndicator.innerHTML = `${sentimentEmoji} ${sentiment}`;

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

    header.append(author, date, sentimentIndicator, actions);

    const text = document.createElement("p");
    text.className = "comment-text";
    text.textContent = comment.text;

    item.append(header, text);
    commentList.appendChild(item);
  };

  const renderEmpty = () => {
    const empty = document.createElement("p");
    empty.className = "no-comments";
    empty.textContent = "Aucun commentaire pour le moment.";
    commentList.appendChild(empty);
  };

  const commentCallbacks = {
    onCommentsLoaded: (comments) => {
      commentList.replaceChildren();
      if (!comments || comments.length === 0) {
        renderEmpty();
        return;
      }
      comments.forEach(renderComment);
    },
    onError: (message) => {
      showFeedback(message, "error");
    },
  };

  const getCsrfToken = () => {
    const tokenInput = commentForm?.querySelector(
      "input[name='csrfmiddlewaretoken']"
    );
    if (tokenInput) return tokenInput.value;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
  };

  /**
   * Fonction helper pour effectuer des requêtes HTTP avec XMLHttpRequest
   * Permet de choisir entre mode synchrone (async = false) ou asynchrone (async = true)
   */
  const xhrRequest = (url, options = {}, async = true) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options.method || "GET";
      const headers = options.headers || {};
      const body = options.body || null;

      // Configuration de la requête (async = true par défaut, false pour synchrone)
      xhr.open(method, url, async);

      // Définition des en-têtes
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      // Gestion de la réponse
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve(data),
            });
          } catch (e) {
            resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve({}),
            });
          }
        } else {
          try {
            const errorData = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            reject({
              ok: false,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve(errorData),
            });
          } catch (e) {
            reject({
              ok: false,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve({}),
            });
          }
        }
      };

      // Gestion des erreurs réseau
      xhr.onerror = () => {
        reject({
          ok: false,
          status: 0,
          statusText: "Network Error",
          json: () => Promise.resolve({}),
        });
      };

      // Envoi de la requête
      xhr.send(body);
    });
  };

  const fetchComments = (async = ASYNC_MODE) => {
    showFeedback("Chargement des commentaires (Ajax)...", "info");
    return xhrRequest(commentsUrl, { headers: { Accept: "application/json" } }, async)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        commentCallbacks.onCommentsLoaded(data.comments || []);
        showFeedback(
          `Commentaires mis à jour (${data.comments?.length || 0})`,
          "success"
        );
        return data;
      })
      .catch((error) => {
        commentCallbacks.onError("Impossible de charger les commentaires.");
      });
  };

  const submitComment = (event, async = ASYNC_MODE) => {
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

    showFeedback("Envoi du commentaire (Ajax)...", "info");

    xhrRequest(commentsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }, async)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data.errors && typeof data.errors === "object") {
          const errorMessage = Object.values(data.errors).flat().join(" / ");
          throw new Error(errorMessage);
        }
        showFeedback("Commentaire enregistré (base mise à jour).", "success");
        commentForm.reset();
        return fetchComments(async);
      })
      .catch((error) => {
        const errorMessage = error.message || "Erreur lors de l'envoi.";
        commentCallbacks.onError(errorMessage);
      });
  };

  commentForm?.addEventListener("submit", submitComment);

  fetchComments();
})();

