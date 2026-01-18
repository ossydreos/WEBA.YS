/**
 * Configuration de l'asynchronisme
 * Changez cette valeur pour tester le comportement synchrone (false) ou asynchrone (true)
 * - true (asynchrone) : Les requêtes ne bloquent pas l'interface utilisateur
 * - false (synchrone) : Les requêtes bloquent l'interface jusqu'à la réponse (déconseillé en production)
 */
const ASYNC_MODE = false;

// =============== INSTRUMENTATION PÉDAGOGIQUE ===============
// Moniteur d'Event Loop - Détecte les blocages du thread principal
let eventLoopLastTick = performance.now();
let eventLoopFreezeCount = 0;
const EVENT_LOOP_THRESHOLD = 120; // ms - seuil de détection de freeze

setInterval(() => {
  const now = performance.now();
  const delta = now - eventLoopLastTick;
  eventLoopLastTick = now;
  
  if (delta > EVENT_LOOP_THRESHOLD) {
    eventLoopFreezeCount++;
    console.warn(
      `🔴 EVENT LOOP FREEZE #${eventLoopFreezeCount} - Durée: ${delta.toFixed(0)}ms ` +
      `(attendu: ~50ms) - Mode: ${ASYNC_MODE ? 'ASYNC' : 'SYNC'}`
    );
  }
}, 50);

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

  const xhrRequest = (url, options = {}, async = true) => {
    const xhr = new XMLHttpRequest();
    const method = options.method || "GET";
    const headers = options.headers || {};
    const body = options.body || null;
    
    // ========== INSTRUMENTATION: Preuve setTimeout (Event Loop) ==========
    const requestId = Math.random().toString(36).substr(2, 9);
    const setTimeoutBefore = performance.now();
    let setTimeoutExecuted = false;
    
    setTimeout(() => {
      const setTimeoutAfter = performance.now();
      const setTimeoutDelay = setTimeoutAfter - setTimeoutBefore;
      setTimeoutExecuted = true;
      
      console.log(
        `⏱️  setTimeout(0) exécuté [${requestId}] - Délai réel: ${setTimeoutDelay.toFixed(0)}ms ` +
        `(attendu: ~0-5ms) - ${setTimeoutDelay > 50 ? '🔴 RETARDÉ par requête synchrone' : '✅ Normal'}`
      );
    }, 0);
    
    // ========== INSTRUMENTATION: Mesure de durée requête ==========
    const requestStartTime = performance.now();
    console.log(
      `%c🚀 DÉBUT REQUÊTE [${requestId}]`,
      'color: #007bff; font-weight: bold;',
      `\n  Mode: ${async ? '✅ ASYNCHRONE' : '🔴 SYNCHRONE'}`,
      `\n  Méthode: ${method}`,
      `\n  URL: ${url}`
    );

    // Configuration de la requête (async = true par défaut, false pour synchrone)
    xhr.open(method, url, async);

    // Définition des en-têtes
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });

    if (async) {
      // Mode asynchrone : retourner une Promise
      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          const requestEndTime = performance.now();
          const duration = requestEndTime - requestStartTime;
          
          console.log(
            `%c✓ FIN REQUÊTE [${requestId}]`,
            'color: #28a745; font-weight: bold;',
            `\n  Durée totale: ${duration.toFixed(0)}ms`,
            `\n  Status: ${xhr.status}`,
            `\n  Mode: ASYNCHRONE (UI NON BLOQUÉE)`
          );
          
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

        xhr.onerror = () => {
          const requestEndTime = performance.now();
          const duration = requestEndTime - requestStartTime;
          console.error(`❌ ERREUR REQUÊTE [${requestId}] - Durée: ${duration.toFixed(0)}ms`);
          
          reject({
            ok: false,
            status: 0,
            statusText: "Network Error",
            json: () => Promise.resolve({}),
          });
        };

        xhr.send(body);
      });
    } else {
      // Mode synchrone : xhr.send() bloque le thread jusqu'à la réponse
      console.warn(
        `%c⚠️  ATTENTION: xhr.send() SYNCHRONE va BLOQUER le thread principal`,
        'color: #ff6b6b; font-weight: bold; font-size: 12px;'
      );
      
      try {
        const sendStartTime = performance.now();
        xhr.send(body); // 🔴 BLOQUE ICI jusqu'à la réponse
        const sendEndTime = performance.now();
        const sendDuration = sendEndTime - sendStartTime;
        
        const requestEndTime = performance.now();
        const totalDuration = requestEndTime - requestStartTime;
        
        console.log(
          `%c✓ FIN REQUÊTE SYNCHRONE [${requestId}]`,
          'color: #ff6b6b; font-weight: bold;',
          `\n  Durée xhr.send() (BLOCAGE): ${sendDuration.toFixed(0)}ms`,
          `\n  Durée totale: ${totalDuration.toFixed(0)}ms`,
          `\n  Status: ${xhr.status}`,
          `\n  🔴 UI ÉTAIT BLOQUÉE pendant ${sendDuration.toFixed(0)}ms`,
          `\n  🔴 Event Loop ÉTAIT GELÉE`,
          `\n  🔴 setTimeout(0) ÉTAIT RETARDÉ`
        );
        
        // Traitement direct après le blocage
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            return Promise.resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve(data),
            });
          } catch (e) {
            return Promise.resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve({}),
            });
          }
        } else {
          try {
            const errorData = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            return Promise.reject({
              ok: false,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve(errorData),
            });
          } catch (e) {
            return Promise.reject({
              ok: false,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve({}),
            });
          }
        }
      } catch (e) {
        const requestEndTime = performance.now();
        const duration = requestEndTime - requestStartTime;
        console.error(
          `❌ ERREUR REQUÊTE SYNCHRONE [${requestId}]`,
          `\n  Durée: ${duration.toFixed(0)}ms`,
          `\n  Erreur:`, e
        );
        
        return Promise.reject({
          ok: false,
          status: 0,
          statusText: "Network Error",
          json: () => Promise.resolve({}),
        });
      }
    }
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

