import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

function Home({
  setPage,
  darkMode,
  setDarkMode,
  onLogout,
  setProfileUsername,
}) {
  const { user } = useAuth();

  const [tweets, setTweets] = useState([]);
  const [tweetPhoto, setTweetPhoto] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [commentText, setCommentText] = useState({});
  const [commenting, setCommenting] = useState({});

  const [openMenu, setOpenMenu] = useState(null);
  const [editingTweet, setEditingTweet] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [expandedComments, setExpandedComments] =
  useState({});

  const fetchTweets = async () => {
    try {
      const response = await api.get("tweets/");

      console.log(
        "Tweets from backend:",
        response.data
      );

      setTweets(response.data);
    } catch (error) {
      console.error(
        "Tweets error:",
        error.response?.data
      );

      setError("Failed to load tweets.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearchText(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const response = await api.get(
        `users/search/?q=${encodeURIComponent(
          value.trim()
        )}`
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error(
        "Search error:",
        error.response?.data
      );

      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const handleLike = async (tweetId) => {
    try {
      const response = await api.post(
        `tweets/${tweetId}/like/`
      );

      setTweets((currentTweets) =>
        currentTweets.map((tweet) =>
          tweet.id === tweetId
            ? {
                ...tweet,
                likes_count:
                  response.data.likes_count,
                liked_by_me:
                  response.data.liked,
              }
            : tweet
        )
      );
    } catch (error) {
      console.error(
        "Like error:",
        error.response?.data
      );
    }
  };

  const handleComment = async (tweetId) => {
    const text =
      commentText[tweetId]?.trim();

    if (!text) {
      return;
    }

    setCommenting((current) => ({
      ...current,
      [tweetId]: true,
    }));

    try {
      await api.post(
        `tweets/${tweetId}/comments/`,
        {
          text: text,
        }
      );

      setCommentText((current) => ({
        ...current,
        [tweetId]: "",
      }));

      await fetchTweets();
    } catch (error) {
      console.error(
        "Comment error:",
        error.response?.data
      );
    } finally {
      setCommenting((current) => ({
        ...current,
        [tweetId]: false,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim() && !tweetPhoto) {
      return;
    }

    setPosting(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "text",
        content.trim()
      );

      if (tweetPhoto) {
        formData.append(
          "photo",
          tweetPhoto
        );
      }

      await api.post(
        "tweets/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setContent("");
      setTweetPhoto(null);

      await fetchTweets();
    } catch (error) {
      console.log(
        "Tweet error:",
        error.response?.data
      );

      setError(
        JSON.stringify(
          error.response?.data
        ) ||
          "Failed to create tweet."
      );
    } finally {
      setPosting(false);
    }
  };

  const handleEditTweet = async (tweetId) => {
    if (!editText.trim()) {
      return;
    }

    setSavingEdit(true);

    try {
      const response = await api.patch(
        `tweets/${tweetId}/`,
        {
          text: editText.trim(),
        }
      );

      setTweets((currentTweets) =>
        currentTweets.map((tweet) =>
          tweet.id === tweetId
            ? response.data
            : tweet
        )
      );

      setEditingTweet(null);
      setEditText("");
      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Edit tweet error:",
        error.response?.data
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tweet?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `tweets/${tweetId}/`
      );

      setTweets((currentTweets) =>
        currentTweets.filter(
          (tweet) =>
            tweet.id !== tweetId
        )
      );

      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Delete tweet error:",
        error.response?.data
      );
    }
  };

  const toggleComments = (tweetId) => {
    setExpandedComments((current) => ({
      ...current,
      [tweetId]: !current[tweetId],
    }));
  };

  if (loading) {
    return <h2>Loading tweets...</h2>;
  }

  return (
    <div
      className={`home-page ${
        darkMode
          ? "dark-mode"
          : "light-mode"
      }`}
    >
      <header className="home-header">
        <h1>𝕏Clone</h1>

        <div className="header-actions">
          <button
            onClick={() =>
              setDarkMode(
                (current) => !current
              )
            }
          >
            {darkMode
              ? "☀️ Light Mode"
              : "🌙 Dark Mode"}
          </button>

          <button onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="home-layout">
        <aside className="sidebar">
          <div
            className="sidebar-profile"
            onClick={() =>
              setPage(
                "profile",
                user?.username
              )
            }
          >
            {user?.avatar ? (
              <img
                className="sidebar-profile-photo"
                src={user.avatar}
                alt="Profile"
              />
            ) : (
              <div className="sidebar-profile-placeholder">
                👤
              </div>
            )}

            <span className="sidebar-username">
              @{user?.username}
            </span>
          </div>

          <div className="sidebar-search">
            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                handleSearch(event.target.value)
              }
              placeholder="🔍 Search..."
            />

            {searchText.trim() && (
              <div className="search-results">
                {searching ? (
                  <p className="search-message">
                    Searching...
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="search-message">
                    No users found.
                  </p>
                ) : (
                  searchResults.map((searchUser) => (
                    <button
                      className="search-result"
                      key={searchUser.id}
                      onClick={() => {
                        setSearchText("");
                        setSearchResults([]);

                        setPage(
                          "profile",
                          searchUser.username
                        );
                      }}
                    >
                      {searchUser.avatar ? (
                        <img
                          className="search-result-photo"
                          src={searchUser.avatar}
                          alt="Profile"
                        />
                      ) : (
                        <div className="search-result-placeholder">
                          👤
                        </div>
                      )}

                      <span>
                        @{searchUser.username}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="feed">
          <section className="composer">
            <h2>
              What's happening?
            </h2>

            <form
              onSubmit={handleSubmit}
            >
              <textarea
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                placeholder="What's happening?"
                rows="4"
              />

              <div className="composer-actions">
                <label className="photo-upload-button">
                  📷 Add Photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setTweetPhoto(
                        event.target.files[0] || null
                      )
                    }
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={
                    posting ||
                    (!content.trim() && !tweetPhoto)
                  }
                >
                  {posting
                    ? "Posting..."
                    : "Post Tweet"}
                </button>
              </div>

                    
            </form>
          </section>

          {error && (
            <p>{error}</p>
          )}

          <h2>
            Latest Tweets
          </h2>

          {tweets.map((tweet) => {
            const isMyTweet =
              tweet.user?.username ===
              user?.username;

            return (
              <article
                className="tweet-card"
                key={tweet.id}
              >
                {/* Tweet header */}

                <div className="tweet-top">
                  <span
                    className="tweet-username"
                    onClick={() => {
                      setPage(
                        "profile",
                        tweet.user?.username
                      );
                    }}
                  >
                    @{tweet.user?.username}
                  </span>

                  {isMyTweet && (
                    <div className="tweet-menu">
                      <button
                        className="tweet-menu-button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu ===
                              tweet.id
                              ? null
                              : tweet.id
                          )
                        }
                      >
                        ⋯
                      </button>

                      {openMenu ===
                        tweet.id && (
                        <div className="tweet-menu-dropdown">
                          <button
                            onClick={() => {
                              setEditingTweet(
                                tweet.id
                              );

                              setEditText(
                                tweet.text
                              );

                              setOpenMenu(
                                null
                              );
                            }}
                          >
                            ✏️ Edit Tweet
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteTweet(
                                tweet.id
                              )
                            }
                          >
                            🗑️ Delete Tweet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tweet text / edit form */}

                {editingTweet ===
                tweet.id ? (
                  <div className="tweet-edit-form">
                    <textarea
                      value={editText}
                      onChange={(event) =>
                        setEditText(
                          event.target
                            .value
                        )
                      }
                      rows="4"
                    />

                    <div className="tweet-edit-actions">
                      <button
                        onClick={() =>
                          handleEditTweet(
                            tweet.id
                          )
                        }
                        disabled={
                          savingEdit ||
                          !editText.trim()
                        }
                      >
                        {savingEdit
                          ? "Saving..."
                          : "Save"}
                      </button>

                      <button
                        onClick={() => {
                          setEditingTweet(
                            null
                          );

                          setEditText(
                            ""
                          );
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tweet-text">
                    {tweet.text}

                    {tweet.photo && (
                      <img
                        className="tweet-photo"
                        src={tweet.photo}
                        alt="Tweet"
                      />
                    )}
                  </div>
                )}

                {/* Like */}

                <div className="tweet-actions">
                  <button
                    className="tweet-action-button"
                    onClick={() =>
                      handleLike(
                        tweet.id
                      )
                    }
                  >
                    {tweet.liked_by_me
                      ? "💔 Unlike"
                      : "❤️ Like"}
                  </button>

                  <span>
                    Likes:{" "}
                    {tweet.likes_count ||
                      0}
                  </span>
                </div>

                {/* Comments */}

                <div className="comments-section">
  <button
    className="comments-toggle-button"
    onClick={() =>
      toggleComments(tweet.id)
    }
  >
    💬 Comments
    {" "}
    ({tweet.comments?.length || 0})
  </button>

  {expandedComments[tweet.id] && (
    <div className="comments-expanded">
      <form
        className="comment-form"
        onSubmit={(event) => {
          event.preventDefault();

          handleComment(tweet.id);
        }}
      >
        <input
          className="comment-input"
          type="text"
          value={
            commentText[tweet.id] || ""
          }
          onChange={(event) =>
            setCommentText((current) => ({
              ...current,
              [tweet.id]:
                event.target.value,
            }))
          }
          placeholder="Write a comment..."
        />

        <button
          className="comment-button"
          type="submit"
          disabled={
            commenting[tweet.id] ||
            !commentText[
              tweet.id
            ]?.trim()
          }
        >
          {commenting[tweet.id]
            ? "Posting..."
            : "Post"}
        </button>
      </form>

      {tweet.comments?.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        tweet.comments?.map((comment) => (
          <div
            className="comment"
            key={comment.id}
          >
            <div className="comment-user">
              @
              {comment.user?.username}
            </div>

            <p className="comment-text">
              {comment.text}
            </p>
          </div>
        ))
      )}
    </div>
  )}
</div>


              </article>
            );
          })}
        </main>
      </div>
    </div>
  );

  
}

export default Home;