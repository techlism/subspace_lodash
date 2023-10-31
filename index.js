const express = require('express')
const axios = require('axios')
const _ = require('lodash')
const app = express()
const dotenv = require('dotenv')
dotenv.config()

let cache = {}

const baseURL = 'https://intent-kit-16.hasura.app/api/rest/blogs'
const cacheTimeout = 60 * 60 * 1000  // 1 hour in milliseconds

app.get('/api/blog-stats', async (req, res) => {
  try {
    const currentTime = new Date().getTime();
    if (cache['blogStats'] && currentTime - cache['blogStats'].time < cacheTimeout) {
      res.json(cache['blogStats'].data)
      return
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
    const uniqueTitles = _.uniq(_.map(blogs, 'title')); 

    const stats = {
      totalBlogs,
      longestTitleBlog: longestTitleBlog.title,
      privacyBlogs,
      totalUniqueTitles : uniqueTitles.length,
      uniqueTitles
    }

    cache['blogStats'] = { time: currentTime, data: stats }

    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ error: `Error in fetching blog data : ${error}` });
  }
});

app.get('/api/blog-search', async (req, res) => {
  try {
    const query = req.query.query
    const currentTime = new Date().getTime();

    if (cache[query] && currentTime - cache[query].time < cacheTimeout) {
      res.json(cache[query].data)
      return
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

    cache[query] = { time: currentTime, data: filteredBlogs }

    res.status(200).json(filteredBlogs);
  } catch (error) {
    res.status(500).json({ error: `Error in fetching blog data : ${error}` });
  }
});

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server is running on port ${port}`))
