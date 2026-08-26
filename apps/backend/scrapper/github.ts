import axios from "axios";
const GIT_HUB_TOKEN = process.env.GIT_HUB_TOKEN;


export async function gitdetails (username : string) {
    const response =  await axios.get(`https://api.github.com/users/${username}/repos` ,{
        headers : {
            Authorization : GIT_HUB_TOKEN
        }
    });
    const userrepodetails = response.data.map((x : any)=>({
        description: x.description,       
        name: x.name,                      
        fullname: x.full_name,             
        starcount: x.stargazers_count 
    }))

    return userrepodetails ;
}

