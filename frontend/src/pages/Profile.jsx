import {
  useEffect,
  useState,
} from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

function Profile({
  setPage,
  darkMode,
  setDarkMode,
  onLogout,
  username,
}) {
  const { user } = useAuth();

  const isOwnProfile =
    !username ||
    username === user?.username;

  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);

  const [openMenu, setOpenMenu] = useState(null);
  const [editingTweet, setEditingTweet] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [expandedComments, setExpandedComments] =
    useState({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileResponse =
          isOwnProfile
            ? await api.get("profile/me/")
            : await api.get(
                `users/${username}/`
              );

        const tweetsResponse =
          await api.get("tweets/");

        setProfile(profileResponse.data);

        setBio(
          profileResponse.data.bio || ""
        );

        const userTweets =
          tweetsResponse.data.filter(
            (tweet) =>
              tweet.user?.username ===
              profileResponse.data.username
          );

        setTweets(userTweets);
      } catch (error) {
        console.error(
          "Profile error:",
          error.response?.data
        );

        setError(
          "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, isOwnProfile]);

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

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("bio", bio);

      if (avatar) {
        formData.append(
          "avatar",
          avatar
        );
      }

      const response = await api.patch(
        "profile/me/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setProfile(response.data);
      setAvatar(null);
      setEditing(false);
    } catch (error) {
      console.error(
        "Profile update error:",
        error.response?.data
      );

      setError(
        "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(profile?.bio || "");
    setAvatar(null);
    setEditing(false);
    setError("");
  };

  const toggleComments = (tweetId) => {
    setExpandedComments((current) => ({
      ...current,
      [tweetId]: !current[tweetId],
    }));
  };

  if (loading) {
    return <h2>Loading profile...</h2>;
  }

  if (error && !profile) {
    return <p>{error}</p>;
  }

  return (
    <div className="profile-page">

      {/* PROFILE HEADER */}

      <div className="profile-header">

        <div className="profile-avatar">

          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt="Profile avatar"
            />
          ) : (
            profile?.username
              ?.charAt(0)
              .toUpperCase()
          )}

        </div>

        <div className="profile-info">

          <h1>
            @{profile?.username}
          </h1>

          <p className="profile-bio">
            {profile?.bio ||
              "No bio yet."}
          </p>

        </div>

        <div className="profile-header-actions">

          {isOwnProfile && (
            <button
              type="button"
              className="profile-edit-button"
              onClick={(event) => {
                setEditing(true);
                event.currentTarget.blur();
              }}
            >
              ✏️ Edit Profile
            </button>
          )}

          <button
            type="button"
            className="profile-home-button"
            onClick={(event) => {
              setPage("home");
              event.currentTarget.blur();
            }}
          >
            🏠 Home
          </button>

          <button
            type="button"
            className="profile-theme-button"
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

        </div>

      </div>


      {/* EDIT PROFILE */}

      {isOwnProfile && editing && (
        <section className="edit-profile">

          <h2>Edit Profile</h2>

          <form onSubmit={handleSave}>

            <label>
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value
                )
              }
              placeholder="Tell people about yourself..."
              rows="4"
            />

            <label>
              Profile Picture
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setAvatar(
                  event.target.files[0] ||
                  null
                )
              }
            />

            {error && (
              <p className="profile-error">
                {error}
              </p>
            )}

            <div className="edit-profile-actions">

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}


      {/* PROFILE STATS */}

      <div className="profile-stats">

        <div>
          <strong>
            {tweets.length}
          </strong>

          <span>
            Tweets
          </span>
        </div>

        {/*<div>
          <strong>0</strong>

          <span>
            Following
          </span>
        </div>

        <div>
          <strong>0</strong>

          <span>
            Followers
          </span>
        </div>*/}

      </div>


      {/* TWEETS */}

      <section className="profile-tweets">

        <h2>
          @{profile?.username}'s Tweets
        </h2>

        {tweets.length === 0 ? (

          <p>
            No tweets yet.
          </p>

        ) : (

          tweets.map((tweet) => (

            <article
              className="profile-tweet"
              key={tweet.id}
            >

              {/* TWEET HEADER */}

              <div className="profile-tweet-top">

                <div className="profile-tweet-user">
                  @{tweet.user?.username}
                </div>

                {isOwnProfile && (
                  <div className="profile-tweet-menu">

                    <button
                      type="button"
                      className="profile-tweet-menu-button"
                      onClick={() =>
                        setOpenMenu(
                          openMenu === tweet.id
                            ? null
                            : tweet.id
                        )
                      }
                    >
                      ⋯
                    </button>

                    {openMenu === tweet.id && (

                      <div className="profile-tweet-dropdown">

                        <button
                          type="button"
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
                          type="button"
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


              {/* TWEET CONTENT */}

              {editingTweet === tweet.id ? (

                <div className="profile-tweet-edit">

                  <textarea
                    value={editText}
                    onChange={(event) =>
                      setEditText(
                        event.target.value
                      )
                    }
                    rows="4"
                  />

                  <div className="profile-tweet-edit-actions">

                    <button
                      type="button"
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
                      type="button"
                      onClick={() => {

                        setEditingTweet(
                          null
                        );

                        setEditText("");

                      }}
                    >
                      Cancel
                    </button>

                  </div>

                </div>

              ) : (

                <>

                  <div className="profile-tweet-content">

                    <p>
                      {tweet.text}
                    </p>

                    {tweet.photo && (
                      <img
                        className="profile-tweet-photo"
                        src={tweet.photo}
                        alt="Tweet"
                      />
                    )}

                  </div>

                  {/* LIKES */}

                  <div className="profile-tweet-meta">

                    ❤️{" "}
                    {tweet.likes_count || 0}
                    {" Likes"}

                  </div>

                  {/* COMMENTS BUTTON */}

                  <button
                    type="button"
                    className="profile-comments-toggle"
                    onClick={() =>
                      toggleComments(
                        tweet.id
                      )
                    }
                  >
                    💬 Comments (
                    {tweet.comments?.length ||
                      0}
                    )
                  </button>

                  {/* EXPANDED COMMENTS */}

                  {expandedComments[
                    tweet.id
                  ] && (

                    <div className="profile-comments-expanded">

                      {tweet.comments?.length ===
                      0 ? (

                        <p>
                          No comments yet.
                        </p>

                      ) : (

                        tweet.comments?.map(
                          (comment) => (

                            <div
                              className="profile-comment"
                              key={comment.id}
                            >

                              <div className="profile-comment-user">
                                @
                                {
                                  comment
                                    .user
                                    ?.username
                                }
                              </div>

                              <p>
                                {
                                  comment.text
                                }
                              </p>

                            </div>

                          )
                        )

                      )}

                    </div>

                  )}

                </>

              )}

            </article>

          ))

        )}

      </section>

    </div>
  );
}

export default Profile;
