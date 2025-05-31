import {snippetRepository} from "../../infrastructure/db/snippet.repository";

export const getSnippets = () => {
    return snippetRepository.getAll()
}
