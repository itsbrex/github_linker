const regex = /github\.com\/(.*\w+)$/

main()

function main() {
    const href = location.href
    console.log('run main', href)
    if ((m = regex.exec(href)) !== null) {
        console.log('regex match', m)
        if (m.length !== 2) {return}
        const repoPath = m[1]
        if (repoPath.indexOf('/') === -1) {return}
        const about = getAbout()
        console.log('about', about)
        const tags = getTags()
        console.log('tags', tags)
        if (about === undefined && tags.length === 0) {return}

        addReleatedBlog("text", searchReleatedInfo(repoPath))
        // searchGitHubReleatdBVideo(repoPath)
        //     .then(result => result.json())
        //     .then(result => console.log(result))
        searchGitHubForSimilar(repoPath, about, tags.join(' '))
            .then(result => result.json())
            .then(result => addSimilarRepo(repoPath, result))
            .catch(e => console.error(e))
    }
}

function appendCardList(head, cards, idx) {
	  if (cards.length === 0) {return}
    let template = `<div class="BorderGrid-row"><div class="BorderGrid-cell"><h2 class="h4 mb-3">${head}</h2>` + cards + `</div></div>`;
    const fragment = document.createRange().createContextualFragment(template);
    const borderGrid = document.querySelector('.BorderGrid');
    console.log(borderGrid.children)
    borderGrid.insertBefore(fragment.firstChild, borderGrid.children[idx])
    // if (borderGrid.children.length <= 1) {
		// 	borderGrid.appendChild(fragment.firstChild)
    // } else {
    //     borderGrid.insertBefore(fragment.firstChild, borderGrid.children[1])
    // }
}

function addReleatedBlog(type, result) {
	console.log('addReleatedBlog', result)
    if (result === undefined) {return}
	let inject = ''
    for (const r of result.slice(0, 4)) {
		// var ico = 'https://raw.githubusercontent.com/ZhuPeng/github_linker/master/assert/'+r.website+'.ico'
		var ico = chrome.runtime.getURL('/assert/'+r.website+'.ico')
		const card = `
        <div class="f4 mt-1 lh-condensed color-fg-default" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
						<i style="padding-left:25px; background:url(${ico}) no-repeat; background-size: contain;"></i>
            <a class="wb-break-all" target="_blank" href="${r.url}">${r.title}</a>
        </div>
		`
		inject += card
	}
	appendCardList("Releated Blogs", inject, 1)
}

function addSimilarRepo(repoPath, repos) {
    console.log('addSimilarRepo:', repos)
    let inject = ''
    var cnt = 0
    for (const repo of repos.items) {
        if (repo.full_name === repoPath || (repo.description && repo.description.length > 2000)) {
            console.log('filter repo:', repo)
            continue;
        }
        cnt += 1;
        if (cnt > 3) {break}
        console.log('add repo:', repo)
        const card = `<div class="Box p-idx-storm mt-2" style="padding: 12px">
    <div>
        <div class="f4 lh-condensed text-bold color-fg-default">
            <a class="Link--primary text-bold no-underline wb-break-all d-inline-block" target="_blank" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%" href="${repo.html_url}">${repo.full_name}</a>
        </div>
        <div class="dashboard-break-word color-fg-muted mt-1">
            <p style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${repo.description ?? ""}</p>
        </div>
        <p class="f6 color-fg-muted mt-2 mb-0">
            <span class="d-inline-block mr-3">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16"
                     data-view-component="true" class="octicon octicon-star mr-1">
    <path fill-rule="evenodd"
          d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path>
</svg>
                    ${repo.stargazers_count}
            </span>
        </p>
    </div>
</div>
`
        inject += card
    }
	appendCardList('Similar repositories', inject, 2)
}

function getAbout() {
    const p = "#repo-content-pjax-container > div > div > div.Layout.Layout--flowRow-until-md.react-repos-overview-margin.Layout--sidebarPosition-end.Layout--sidebarPosition-flowRow-end > div.Layout-sidebar > div.BorderGrid.about-margin > div:nth-child(1) > div > div > p"
    const sel = document.querySelector(p)
    if (sel) {
        return sel.innerText
    }
}

function getTags () {
    const result = []
    const tags = document.querySelector("#repo-content-pjax-container > div > div > div.Layout.Layout--flowRow-until-md.react-repos-overview-margin.Layout--sidebarPosition-end.Layout--sidebarPosition-flowRow-end > div.Layout-sidebar > div.BorderGrid.about-margin > div:nth-child(1) > div > div > div.my-3 > div")
    if (!tags) {
        return result
    }
    for (const child of tags.children) {
        const text = child.innerText.trim()
        if (text.length) {
            result.push(text)
        }
    }
    return result.slice(0, 5)
}

function searchReleatedInfo(reponame) {
	var key = 'github-data-100' 
	var cached = localStorage.getItem(key) || false;
    if (cached !== false) {
		var c = JSON.parse(cached)
		// console.log('parse', c)
		var result = []
		for (const r of c) {
			if (r.repo !== reponame) {continue}
			result.push(r)
		}
    return result
	}

	fetch(chrome.runtime.getURL('/assert/data.json'))
  // fetch('https://raw.githubusercontent.com/ZhuPeng/github_linker/master/chrome/assert/data.json')
     .then(response => response.json())
     .then(data => {
         console.log('fetch data:', data)
         localStorage.setItem(key, JSON.stringify(data));
			   return data
     })
     .catch(error => {
         console.log('fetch json:', error);
     });
}

async function searchGitHubReleatdBVideo(reponame) {
    console.log('searchGitHubReleatdBVideo:', reponame)
	const headerObj = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
		'User-Agent': 'vivek/repository-suggestions'
	}

	const API = 'https://api.bilibili.com/x/web-interface/search/type';
    const page = '?keyword=' + reponame + '&search_type=video';

	const request = new Request(`${API}${page}`, {
		headers: new Headers(headerObj),
        mode: 'no-cors',
        credentials: 'include',
	})

	return fetch(request)
		.then(response => {
            return response
	})
}


async function searchGitHubForSimilar(url, about, tags) {
    console.log('searchGitHubForSimilar:', url, about, tags)
	const headerObj = {
		'User-Agent': 'vivek/repository-suggestions'
	}

	const API = 'https://api.github.com/search/repositories';

    var keyword = tags
    if (keyword.length < 10) {
        keyword = keyword + ' ' + url.split("/")[1]
    }
    console.log('real search query:', keyword)
    const page = '?q=' + keyword + '+in:name,description,topics' + '&sort=stars&order=desc';

	const request = new Request(`${API}${page}`, {
		headers: new Headers(headerObj)
	})

	return fetch(request)
		.then(response => {
            return response
	})
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === 'url changed') {
            main()
        }
    }
);
