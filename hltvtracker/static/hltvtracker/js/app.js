/**
 * JavaScript vanilla pour le projet (DOM, callbacks, Ajax).
 * Sources consultées : MDN Web Docs (fetch API) et w3schools/Ajax vanilla.
 */
(function () {
  const commentsArea = document.querySelector("#comments-area");
  const commentList = document.querySelector("#comment-list");
  const commentForm = document.querySelector("#comment-form");
  const feedbackBox = document.querySelector("#comment-feedback");

  if (!commentsArea || !commentList) {
    return; // page sans match, on ne fait rien
  }

  const commentsUrl = commentsArea.dataset.commentsUrl;
  const matchId = commentsArea.dataset.matchId;

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

    header.append(author, date);

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

  const fetchComments = () => {
    showFeedback("Chargement des commentaires (Ajax)...", "info");
    return fetch(commentsUrl, { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Impossible de charger les commentaires.");
        }
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
        commentCallbacks.onError(error.message);
      });
  };

  const submitComment = (event) => {
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

    fetch(commentsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMessage =
            data?.errors && typeof data.errors === "object"
              ? Object.values(data.errors).flat().join(" / ")
              : "Erreur lors de l'envoi.";
          throw new Error(errorMessage);
        }
        showFeedback("Commentaire enregistré (base mise à jour).", "success");
        commentForm.reset();
        return fetchComments();
      })
      .catch((error) => {
        commentCallbacks.onError(error.message);
      });
  };

  commentForm?.addEventListener("submit", submitComment);

  // Premier chargement Ajax pour éviter un rechargement complet.
  fetchComments();
})();

