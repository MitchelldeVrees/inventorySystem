import posts from './data'

export function onRequestGet(context){
    const id = context.params.id

    if(!id){
        return new Reponse("No id provided", {status: 404})
    }

    const post = posts.find(post => post.id === Number(id));

    if(!post){
        return new Response("Post not found", {status: 404})
    }
    return Response.json(post)
}