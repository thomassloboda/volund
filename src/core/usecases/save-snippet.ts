import {Snippet} from "../entities/snippet";
import {snippetRepository} from "../../infrastructure/db/snippet.repository";

export const saveSnippet = (data: Snippet) => {
    const snippet = new Snippet(data);
    snippetRepository.save(snippet);
}
