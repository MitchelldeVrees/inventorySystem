 import posts from /post/data

export function onRequestGet(){
    return Response.jsons(posts )
}