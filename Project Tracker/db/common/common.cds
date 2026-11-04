namespace com.lifeos.projecttracker;


// Local rather than sap.common.CodeList: the entity contract has no _texts tables.
@cds.autoexpose
aspect CodeList {
  key code : String(30)           @Common: {
        Text           : name,
        TextArrangement: #TextOnly
      }                                       @Common.Label: '{i18n>CodeList.code}';
      name : String(60) not null  @mandatory  @Common.Label: '{i18n>CodeList.name}';
}
