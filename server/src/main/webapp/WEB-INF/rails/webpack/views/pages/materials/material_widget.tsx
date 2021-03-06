/*
 * Copyright 2020 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {SparkRoutes} from "helpers/spark_routes";
import {timeFormatter} from "helpers/time_formatter";
import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import {MaterialModification} from "models/config_repos/types";
import {MaterialWithFingerprint, MaterialWithModification, PackageMaterialAttributes, PluggableScmMaterialAttributes} from "models/materials/materials";
import {CollapsiblePanel} from "views/components/collapsible_panel";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Edit, IconGroup, List, Usage} from "views/components/icons";
import {KeyValuePair} from "views/components/key_value_pair";
import {Link} from "views/components/link";
import headerStyles from "views/pages/config_repos/index.scss";
import {AdditionalInfoAttrs} from "views/pages/materials";
import styles from "./index.scss";
import {MaterialHeaderWidget} from "./material_header_widget";

export interface MaterialAttrs {
  material: MaterialWithModification;
}

interface MaterialWithInfoAttrs extends MaterialAttrs, AdditionalInfoAttrs {
}

export class MaterialWidget extends MithrilViewComponent<MaterialWithInfoAttrs> {

  public static showModificationDetails(modification: MaterialModification) {
    const attrs = new Map();
    attrs.set("Username", modification.username);
    attrs.set("Email", modification.emailAddress);
    attrs.set("Revision", modification.revision);
    attrs.set("Comment", modification.comment);
    attrs.set("Modified Time", <span
      title={timeFormatter.formatInServerTime(modification.modifiedTime)}>{timeFormatter.format(modification.modifiedTime)}</span>);

    return attrs;
  }

  view(vnode: m.Vnode<MaterialWithInfoAttrs, this>): m.Children | void | null {
    const material          = vnode.attrs.material;
    const config            = material.config;
    let modificationDetails = <FlashMessage type={MessageType.info}>This material was never parsed</FlashMessage>;
    if (material.modification !== null) {
      const modDetails = MaterialWidget.showModificationDetails(material.modification);
      modDetails.set('Comment', <div class={styles.comment}>{modDetails.get('Comment')}</div>);
      modificationDetails = <KeyValuePair data={modDetails}/>;
    }

    let maybeEditButton;

    const materialType = config.type();
    if (materialType === "package" || materialType === "plugin") {
      maybeEditButton = <Edit data-test-id={"edit-material"} title={"Edit package"}
                              onclick={vnode.attrs.onEdit.bind(this, config)}/>;
    }
    const actionButtons = <IconGroup>
      {maybeEditButton}
      <Usage data-test-id={"show-usages"} title={"Show Usages"} onclick={vnode.attrs.showUsages.bind(this, config)}/>
      <List data-test-id={"show-modifications-material"} title={"Show Modifications"}
            onclick={vnode.attrs.showModifications.bind(this, config)}/>
    </IconGroup>;

    return <CollapsiblePanel header={<MaterialHeaderWidget {...vnode.attrs} />}
                             actions={actionButtons}>
      <h3>Latest Modification Details</h3>
      <div data-test-id="latest-modification-details" className={headerStyles.configRepoProperties}>
        {modificationDetails}
      </div>
      <h3>Material Attributes</h3>
      <KeyValuePair data-test-id={"material-attributes"} data={this.getMaterialData(material.config, vnode.attrs.shouldShowPackageOrScmLink)}/>
    </CollapsiblePanel>;
  }

  private getMaterialData(material: MaterialWithFingerprint, shouldShowPackageOrScmLink: boolean): Map<string, m.Children> {
    let map = new Map();
    if (material.type() === "package") {
      const pkgAttrs = material.attributes() as PackageMaterialAttributes;

      const pkgName = shouldShowPackageOrScmLink
        ? <Link href={SparkRoutes.packageRepositoriesSPA(pkgAttrs.packageRepoName(), pkgAttrs.packageName())}>
          {pkgAttrs.packageName()}
        </Link>
        : pkgAttrs.packageName();

      map.set("Ref", pkgName);
    } else if (material.type() === "plugin") {
      const pluginAttrs = material.attributes() as PluggableScmMaterialAttributes;

      const value = shouldShowPackageOrScmLink
        ? <Link href={SparkRoutes.pluggableScmSPA(pluginAttrs.scmName())}>
          {pluginAttrs.scmName()}
        </Link>
        : pluginAttrs.scmName();

      map.set("Ref", value);
    } else {
      map = material.attributesAsMap();
    }
    return map;
  }
}
