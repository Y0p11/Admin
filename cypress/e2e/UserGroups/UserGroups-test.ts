/*
import { UserGroupObject } from '../../objects/UserGroupObject';

describe('User Groups', () => {
  beforeEach(() => {
    cy.login();
    cy.fixture('userGroup/item.json').then((item) => {
      this.group = item;
    });
    const pageObj = new UserGroupObject();
    pageObj.navigateToPage('user_groups').assertTable();
  });

  // RENDER
  it('group element is rendering correctly', () => {
    const pageObj = new UserGroupObject();
    pageObj.getList().navigateToPage('user_groups');
    cy.wait('@userGroups').then((interception) => {
      if (!!interception.response.body.data.length) {
        pageObj.listShouldBe(true);
      } else {
        pageObj.listShouldBe(false);
      }
    });
  });

  // ADD ELEMENT
  it('add group element', () => {
    const pageObj = new UserGroupObject(this.group.name);
    pageObj
      .navigateToPage('user_groups/new')
      .createNewGroup()
      .getList()
      .navigateToPage('user_groups')
      .itemShouldExist();
  });

  // SEARCH FOR ADDED ELEMENT
  it('search added group element', () => {
    const pageObj = new UserGroupObject(this.group.name);
    pageObj.navigateToPage('user_groups').searchAddedItem().itemShouldExist();
  });

  // DELETE ELEMENT
  it('delete group element', () => {
    const pageObj = new UserGroupObject(this.group.name);
    pageObj
      .getList()
      .navigateToPage('user_groups')
      .itemShouldExist()
      .clickDeleteButton()
      .confirmDelete()
      .itemShouldNotExist();
  });
});
*/
