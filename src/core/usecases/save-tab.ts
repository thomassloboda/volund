import {Tab} from "../entities/tab";
import {tabRepository} from "../../infrastructure/db/tab.repository";

export const saveTab = (data: Tab) => {
    const tab = new Tab(data);
    tabRepository.save(tab);
    return tab;
}

export const deleteTab = (id: string) => {
    tabRepository.deleteById(id);
}
