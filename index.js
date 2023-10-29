const express = require('express')
const axios = require('axios')
const _ = require('lodash')
const app = express()
const dotenv = require('dotenv')
dotenv.config()

let cache = {}

const baseURL = 'https://intent-kit-16.hasura.app/api/rest/blogs'

app.get('/api/blog-stats', async (req, res) => {
  try {
    if (cache['blogStats']) {
      return res.json(cache['blogStats'])
    }

    const response = await axios.get(baseURL, {
      headers: {
        'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET
      }
    })
    const blogs = response.data.blogs

    const totalBlogs = blogs.length
    const longestTitleBlog = _.maxBy(blogs, blog => blog.title.length)
    const privacyBlogs = _.filter(blogs, blog =>
      blog.title.toLowerCase().includes('privacy')
    ).length;
    // Since it was not clear whether to use ID or title for uniqueness. I chose title as all the ids were coming unique
    const uniqueTitles = _.uniq(_.map(blogs, 'title')); 
    console.log(uniqueTitles.length);
    const stats = {
      totalBlogs,
      longestTitleBlog: longestTitleBlog.title,
      privacyBlogs,
      totalUniqueTitles : uniqueTitles.length,
      uniqueTitles
    }

    cache['blogStats'] = stats

    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ error: `Error in fetching blog data : ${error}` });
  }
});

app.get('/api/blog-search', async (req, res) => {
  try {
    const query = req.query.query

    if (cache[query]) {
      return res.json(cache[query])
    }

    const response = await axios.get(baseURL, {
      headers: {
        'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET
      }
    })

    const blogs = response.data.blogs

    const filteredBlogs = blogs.filter(blog =>
      blog.title.toLowerCase().includes(query.toLowerCase())
    );

    cache[query] = filteredBlogs

    res.status(200).json(filteredBlogs);
  } catch (error) {
    res.status(500).json({ error: `Error in fetching blog data : ${error}` });
  }
});
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server is running on port ${port}`))
