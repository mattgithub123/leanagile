// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import Config from '../../../../app.config';
import { AjaxError, PageContent, ContextMenu, RefreshBar } from '../../../../components/shared';
import { DevicesGrid } from '../../../../components/pages/devices/devicesGrid';
import { JobGrid, JobStatusGrid } from '../../../../components/pages/maintenance/grids';
import { TimeIntervalDropdown } from '../../../../components/app/timeIntervalDropdown';

import { IoTHubManagerService } from '../../../../services';

export class JobDetails extends Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedJob: undefined,
      selectedDevices: undefined,
      jobStatusIsPending: true,
      jobStatus: undefined,
      jobStatusError: undefined,
      contextBtns: undefined,
      refreshPending: true
    };
  }

  componentDidMount() {
    this.handleNewProps(this.props);
    this.clearSubscription();
  }

  componentWillReceiveProps(nextProps) {
    this.handleNewProps(nextProps);
  }

  handleNewProps(nextProps) {
    // TODO: Need to reset selectedJob when the job ID changes or when the user clicked refresh (i.e. refreshPending = true).
    //       A long term fix would be to normalize the job data in maintenance.js (similar to how Telemetry is handled there).
    //       When/if that happens, remove all use of refreshPending in the local state of this component.
    if ((
        nextProps.match.params.id !== (this.state.selectedJob || {}).jobId
        || this.state.timeIntervalChangePending
        || this.state.refreshPending
      ) && nextProps.jobs.length) {
      const selectedJob = nextProps.jobs.filter(({ jobId }) => jobId === nextProps.match.params.id)[0];
      this.setState({ selectedJob, refreshPending: false, timeIntervalChangePending: false }, () => this.refreshJobStatus());
    }
  }

  getJobStatus(jobId) {
    this.clearSubscription();
    this.setState({ jobStatusIsPending: true });
    this.subscription = IoTHubManagerService.getJobStatus(jobId)
      .subscribe(
        jobStatus => this.setState({ jobStatus, jobStatusIsPending: false }),
        jobStatusError => this.setState({ jobStatusError, jobStatusIsPending: false })
      );
  }

  refreshJobStatus = () => {
    if (this.state.selectedJob && this.state.selectedJob.jobId) {
      this.getJobStatus(this.state.selectedJob.jobId);
    }
  }

  clearSubscription() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  refreshData = () => {
    this.setState({ selectedJob: undefined, refreshPending: true });
    this.props.refreshData();
    // TODO: When refreshPending is removed in favor of normalizing the job data, the next line may be needed.
    // this.refreshJobStatus();
  }

  onContextMenuChange = contextBtns => this.setState({ contextBtns });

  onTimeIntervalChange = (timeInterval) => {
    this.setState({ selectedJob: undefined, timeIntervalChangePending: true });
    this.props.onTimeIntervalChange(timeInterval);
  }

  render() {
    const {
      deviceEntities,
      error,
      isPending,
      lastUpdated,
      t,
      timeInterval
    } = this.props;

    const selectedJob = this.state.selectedJob;
    const jobGridProps = {
      domLayout: 'autoHeight',
      rowData: isPending ? undefined : selectedJob ? [selectedJob] : [],
      pagination: false,
      t
    };

    const jobStatusGridProps = {
      domLayout: 'autoHeight',
      rowData: this.state.jobStatusIsPending ? undefined : [this.state.jobStatus],
      pagination: true,
      paginationPageSize: Config.smallGridPageSize,
      onRowClicked: ({ data: { devices } }) => this.setState({
        selectedDevices: devices.map(({ deviceId }) => deviceEntities[deviceId])
      }),
      t
    };

    return [
      <ContextMenu key="context-menu">
        {this.state.contextBtns}
        <RefreshBar
          refresh={this.refreshData}
          time={lastUpdated}
          isPending={isPending}
          t={t} />
        <TimeIntervalDropdown
          onChange={this.onTimeIntervalChange}
          value={timeInterval}
          t={t} />
      </ContextMenu>,
      <PageContent className="maintenance-container" key="page-content">
        <h1 className="maintenance-header">{selectedJob ? selectedJob.jobId : ""}</h1>
        {
          !error
            ? <div>
                <JobGrid {...jobGridProps} />
                {!isPending && !selectedJob && t('maintenance.noData')}
                {selectedJob && <JobStatusGrid {...jobStatusGridProps} />}
                {<h4 className="maintenance-sub-header">{t('maintenance.devices')}</h4>}
                {
                  this.state.selectedDevices
                    ? <DevicesGrid
                        t={t}
                        domLayout={'autoHeight'}
                        rowData={this.state.selectedDevices}
                        onContextMenuChange={this.onContextMenuChange} />
                    : t('maintenance.noOccurrenceSelected')
                }
            </div>
            : <AjaxError t={t} error={error} />
        }
      </PageContent>
    ];
  }
}
