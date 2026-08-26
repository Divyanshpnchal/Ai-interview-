import axios from "axios";


export async function gitdetails (username : string) {
    const response =  await axios.get(`https://api.github.com/users/${username}/repos`);
    const userrepodetails = response.data.map((x : any)=>({
        description: x.description,       
        name: x.name,                      
        fullname: x.full_name,             
        starcount: x.stargazers_count 
    }))

    return userrepodetails ;
}

