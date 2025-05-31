import {tabRepository} from "../../infrastructure/db/tab.repository";
import {Tab} from "../entities/tab";

export const getTabs = (): Tab[] => {
    const tabs = tabRepository.getAll();
    return tabs.map(tab => new Tab(tab));
}
