const axios = require("axios");

const AUTH_URL = "http://20.244.56.144/test/auth";
const USERS_URL = "http://20.244.56.144/test/users";

const credentials = {
  companyName: "IIIT BGP",
  clientID: "e531a929-f360-44db-9aee-99ff828c050a",
  clientSecret: "HymkkMgnhcCeOMii",
  ownerName: "AKASH KUMAR",
  ownerEmail: "akash.2201181me@iiitbh.ac.in",
  rollNo: "2201181ME",
};

async function getAccessToken() {
  try {
    const response = await axios.post(AUTH_URL, credentials);
    return response.data.access_token;
  } catch (error) {
    console.error("Error");
    throw new Error("Failed!!");
  }
}

async function getTopUsers(req, res) {
  try {
    const accessToken = await getAccessToken();

    const usersResponse = await axios.get(USERS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const usersData = usersResponse.data.users || usersResponse.data;
    if (!usersData || typeof usersData !== "object") {
      return res.status(500).json({ message: "Invalid" });
    }

    const users = Object.entries(usersData)
      .map(([id, name]) => ({ id: Number(id), name }))
      .filter((user) => !isNaN(user.id));

    if (users.length === 0) {
      return res.status(404).json({ message: "No valid users" });
    }

    const userPostCounts = await Promise.all(
      users.map(async (user) => {
        const postsResponse = await axios.get(`${USERS_URL}/${user.id}/posts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const postCount = postsResponse.data.posts
          ? postsResponse.data.posts.length
          : 0;

        return { id: user.id, name: user.name, postCount };
      })
    );

    userPostCounts.sort((a, b) => b.postCount - a.postCount);
    const topUsers = userPostCounts.slice(0, 5);

    res.json(topUsers);
  } catch (error) {
    console.error("Error");
    res.status(500).json({ message: "Error" });
  }
}

module.exports = { getTopUsers };
